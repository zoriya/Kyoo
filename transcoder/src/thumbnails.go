package src

import (
	"context"
	"encoding/base64"
	"fmt"
	"image"
	"image/color"
	"io"
	"log/slog"
	"math"
	"runtime/debug"
	"strings"
	"sync"

	"github.com/disintegration/imaging"
	"github.com/zoriya/kyoo/transcoder/src/utils"
	"gitlab.com/opennota/screengen"
)

// We want to have a thumbnail every ${interval} seconds.
var default_interval = 10

// The maximim number of thumbnails per video.
// Setting this too high allows really long processing times.
var max_numcaps = 150

type Thumbnail struct {
	ready sync.WaitGroup
	path  string
}

const ThumbsVersion = 1

func getThumbPath(sha string) string {
	return fmt.Sprintf("%s/thumbs-v%d.png", sha, ThumbsVersion)
}

func getThumbVttPath(sha string) string {
	return fmt.Sprintf("%s/thumbs-v%d.vtt", sha, ThumbsVersion)
}

func (s *MetadataService) GetThumbVtt(ctx context.Context, path string, sha string) (io.ReadCloser, error) {
	_, err := s.ExtractThumbs(context.WithoutCancel(ctx), path, sha)
	if err != nil {
		return nil, err
	}

	vttPath := getThumbVttPath(sha)
	vtt, err := s.storage.GetItem(ctx, vttPath)
	if err != nil {
		return nil, fmt.Errorf("failed to get thumbnail vtt with path %q: %w", vttPath, err)
	}
	return vtt, nil
}

func (s *MetadataService) GetThumbSprite(ctx context.Context, path string, sha string) (io.ReadCloser, error) {
	_, err := s.ExtractThumbs(context.WithoutCancel(ctx), path, sha)
	if err != nil {
		return nil, err
	}

	spritePath := getThumbPath(sha)
	sprite, err := s.storage.GetItem(ctx, spritePath)
	if err != nil {
		return nil, fmt.Errorf("failed to get thumbnail sprite with path %q: %w", spritePath, err)
	}
	return sprite, nil
}

func (s *MetadataService) ExtractThumbs(ctx context.Context, path string, sha string) (res interface{}, err error) {
	get_running, set := s.thumbLock.Start(sha)
	if get_running != nil {
		return get_running()
	}
	defer func() {
		if r := recover(); r != nil {
			slog.ErrorContext(ctx, "recovered from panic while extracting thumbnails",
				"path", path, "panic", fmt.Sprintf("%v", r), "stack", string(debug.Stack()))
			res, err = set(nil, fmt.Errorf("panic while extracting thumbnails: %v", r))
		}
	}()

	err = s.extractThumbnail(ctx, path, sha)
	if err != nil {
		return set(nil, err)
	}
	_, err = s.Database.Exec(ctx, `update gocoder.info set ver_thumbs = $2 where sha = $1`, sha, ThumbsVersion)
	return set(nil, err)
}

func (s *MetadataService) extractThumbnail(ctx context.Context, path string, sha string) (err error) {
	defer utils.PrintExecTime(ctx, "extracting thumbnails for %s", path)()

	vttPath := getThumbVttPath(sha)
	spritePath := getThumbPath(sha)

	spriteOk, _ := s.storage.DoesItemExist(ctx, spritePath)
	vttOk, _ := s.storage.DoesItemExist(ctx, vttPath)
	if spriteOk && vttOk {
		return nil
	}

	gen, err := screengen.NewGenerator(path)
	if err != nil {
		slog.ErrorContext(ctx, "error reading video file", "path", path, "err", err)
		return err
	}
	defer gen.Close()

	gen.Fast = true

	duration := int(gen.Duration) / 1000
	if duration <= 0 || gen.Height() <= 0 || gen.Width() <= 0 {
		slog.WarnContext(ctx, "skipping thumbnail extraction: no usable duration or video dimensions",
			"path", path, "duration", duration, "height", gen.Height(), "width", gen.Width())
		return nil
	}
	numcaps := min(max(duration/default_interval, 1), max_numcaps)
	interval := max(duration/numcaps, 1)
	columns := max(int(math.Sqrt(float64(numcaps))), 1)
	rows := int(math.Ceil(float64(numcaps) / float64(columns)))

	height := 144
	width := int(float64(height) / float64(gen.Height()) * float64(gen.Width()))

	sprite := imaging.New(width*columns, height*rows, color.Black)
	vtt := "WEBVTT\n\n"

	slog.InfoContext(ctx, "extracting thumbnails", "count", numcaps, "path", path, "interval", interval)

	ts := 0
	for i := 0; i < numcaps; i++ {
		img, err := gen.ImageWxH(int64(ts*1000), width, height)
		if err != nil {
			slog.ErrorContext(ctx, "could not generate screenshot", "err", err)
			return err
		}

		x := (i % columns) * width
		y := (i / columns) * height
		sprite = imaging.Paste(sprite, img, image.Pt(x, y))

		timestamps := ts
		ts += interval
		vtt += fmt.Sprintf(
			"%s --> %s\n/video/%s/thumbnails.png#xywh=%d,%d,%d,%d\n\n",
			tsToVttTime(timestamps),
			tsToVttTime(ts),
			base64.RawURLEncoding.EncodeToString([]byte(path)),
			x,
			y,
			width,
			height,
		)
	}

	_ = s.storage.DeleteItem(ctx, spritePath)
	_ = s.storage.DeleteItem(ctx, vttPath)

	spriteFormat, err := imaging.FormatFromFilename(spritePath)
	if err != nil {
		return err
	}

	err = s.storage.SaveItemWithCallback(ctx, spritePath, func(_ context.Context, writer io.Writer) error {
		return imaging.Encode(writer, sprite, spriteFormat)
	})
	if err != nil {
		return err
	}
	return s.storage.SaveItem(ctx, vttPath, strings.NewReader(vtt))
}

func tsToVttTime(ts int) string {
	return fmt.Sprintf("%02d:%02d:%02d.000", ts/3600, (ts/60)%60, ts%60)
}
