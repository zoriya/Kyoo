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

type ThumbnailsCreator struct {
	created map[string]string
	running map[string]chan struct{}
	lock    sync.Mutex
}

func NewThumbnailsCreator() *ThumbnailsCreator {
	return &ThumbnailsCreator{
		created: make(map[string]string),
		running: make(map[string]chan struct{}),
	}
}

func (t *ThumbnailsCreator) ExtractThumbnail(path string, name string) (string, error) {
	t.lock.Lock()
	defer t.lock.Unlock()

	out, ok := t.created[path]
	if ok {
		return out, nil
	}

	wait, ok := t.running[path]
	if ok {
		t.lock.Unlock()
		<-wait
		t.lock.Lock()
		out = t.created[path]
		return out, nil
	}
	wait = make(chan struct{})
	t.running[path] = wait

	t.lock.Unlock()

	out, err := extractThumbnail(path, name)
	t.lock.Lock()
	// this will be unlocked by the defer at the top of the function.

	delete(t.running, path)
	if err == nil {
		t.created[path] = out
	}
	return out, err
}

func extractThumbnail(path string, name string) (string, error) {
	ret, err := GetInfo(path)
	if err != nil {
		return "", err
	}
	out := fmt.Sprintf("%s/%s", GetMetadataPath(), ret.Sha)
	sprite_path := fmt.Sprintf("%s/sprite.png", out)
	vtt_path := fmt.Sprintf("%s/sprite.vtt", out)

	gen, err := screengen.NewGenerator(path)
	if err != nil {
		log.Printf("Error reading video file: %v", err)
		return "", err
	}
	defer gen.Close()

	gen.Fast = true

	// truncate duration to full seconds
	// this prevents empty/black images when the movie is some milliseconds longer
	// ffmpeg then sometimes takes a black screenshot AFTER the movie finished for some reason
	duration := 1000 * (int(gen.Duration) / 1000)
	var numcaps, interval int
	if default_interval < duration {
		numcaps = duration / default_interval * 1000
		interval = default_interval
	} else {
		numcaps = duration / 10
		interval = duration / numcaps
	}
	columns := int(math.Sqrt(float64(numcaps)))
	rows := int(math.Ceil(float64(numcaps) / float64(columns)))

	width := gen.Width()
	height := gen.Height()

	sprite := imaging.New(width*columns, height*rows, color.Black)
	vtt := "WEBVTT\n\n"

	ts := 0
	for i := 0; i < numcaps; i++ {
		img, err := gen.Image(int64(ts))
		if err != nil {
			log.Printf("Could not generate screenshot %s", err)
			return "", err
		}

		// TODO: resize image

		x := i % width
		y := i / width
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

	os.WriteFile(vtt_path, []byte(vtt), 0o644)
	imaging.Save(sprite, sprite_path)
	return out, nil
}

func tsToVttTime(ts int) string {
	return fmt.Sprintf("%02d:%02d:%02d.000", ts/3600, ts/60, ts%60)
}
