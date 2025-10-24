package src

import (
	"context"
	"encoding/base64"
	"fmt"
	"image"
	"image/color"
	"io"
	"log"
	"math"
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
	_, err := s.ExtractThumbs(ctx, path, sha)
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
	_, err := s.ExtractThumbs(ctx, path, sha)
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

func (s *MetadataService) ExtractThumbs(ctx context.Context, path string, sha string) (interface{}, error) {
	get_running, set := s.thumbLock.Start(sha)
	if get_running != nil {
		return get_running()
	}

	err := s.extractThumbnail(ctx, path, sha)
	if err != nil {
		return set(nil, err)
	}
	_, err = s.database.Exec(`update info set ver_thumbs = $2 where sha = $1`, sha, ThumbsVersion)
	return set(nil, err)
}

func (s *MetadataService) extractThumbnail(ctx context.Context, path string, sha string) (err error) {
	defer utils.PrintExecTime("extracting thumbnails for %s", path)()

	vttPath := getThumbVttPath(sha)
	spritePath := getThumbPath(sha)

	alreadyOk, _ := s.storage.DoesItemExist(ctx, spritePath)
	if alreadyOk {
		return nil
	}

	gen, err := screengen.NewGenerator(path)
	if err != nil {
		log.Printf("Error reading video file: %v", err)
		return err
	}
	defer gen.Close()

	gen.Fast = true

	duration := int(gen.Duration) / 1000
	var numcaps int
	if default_interval < duration {
		numcaps = duration / default_interval
	} else {
		numcaps = duration / 10
	}
	numcaps = min(numcaps, max_numcaps)
	interval := duration / numcaps
	columns := int(math.Sqrt(float64(numcaps)))
	rows := int(math.Ceil(float64(numcaps) / float64(columns)))

	height := 144
	width := int(float64(height) / float64(gen.Height()) * float64(gen.Width()))

	sprite := imaging.New(width*columns, height*rows, color.Black)
	vtt := "WEBVTT\n\n"

	log.Printf("Extracting %d thumbnails for %s (interval of %d).", numcaps, path, interval)

	ts := 0
	for i := 0; i < numcaps; i++ {
		img, err := gen.ImageWxH(int64(ts*1000), width, height)
		if err != nil {
			log.Printf("Could not generate screenshot %s", err)
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
