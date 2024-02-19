package src

import (
	"fmt"
	"image"
	"image/color"
	"log"
	"math"
	"os"
	"sync"

	"github.com/disintegration/imaging"
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

var thumbnails = NewCMap[string, *Thumbnail]()

func ExtractThumbnail(path string, route string, sha *string) (string, error) {
	ret, _ := thumbnails.GetOrCreate(path, func() *Thumbnail {
		if sha == nil {
			nsha, err := GetHash(path)
			if err != nil {
				return nil
			}
			sha = &nsha
		}
		ret := &Thumbnail{
			path: fmt.Sprintf("%s/%s", Settings.Metadata, sha),
		}
		ret.ready.Add(1)
		go func() {
			extractThumbnail(path, ret.path, fmt.Sprintf("%s/thumbnails.png", route))
			ret.ready.Done()
		}()
		return ret
	})
	ret.ready.Wait()
	return ret.path, nil
}

func extractThumbnail(path string, out string, name string) error {
	defer printExecTime("extracting thumbnails for %s", path)()
	os.MkdirAll(out, 0o755)
	sprite_path := fmt.Sprintf("%s/sprite.png", out)
	vtt_path := fmt.Sprintf("%s/sprite.vtt", out)

	if _, err := os.Stat(sprite_path); err == nil {
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
			"%s --> %s\n%s#xywh=%d,%d,%d,%d\n\n",
			tsToVttTime(timestamps),
			tsToVttTime(ts),
			name,
			x,
			y,
			width,
			height,
		)
	}

	err = os.WriteFile(vtt_path, []byte(vtt), 0o644)
	if err != nil {
		return err
	}
	err = imaging.Save(sprite, sprite_path)
	if err != nil {
		return err
	}
	return nil
}

func tsToVttTime(ts int) string {
	return fmt.Sprintf("%02d:%02d:%02d.000", ts/3600, (ts/60)%60, ts%60)
}
