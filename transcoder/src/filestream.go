package src

import (
	"math"
	"os/exec"
	"strconv"
	"strings"
)

type FileStream struct {
	Path        string
	Keyframes   []float64
	CanTransmux bool
	streams     map[Quality]TranscodeStream
}

func NewFileStream(path string) (*FileStream, error) {
	keyframes, can_transmux, err := GetKeyframes(path)
	if err != nil {
		return nil, err
	}

	return &FileStream{
		Path:        path,
		Keyframes:   keyframes,
		CanTransmux: can_transmux,
		streams:     make(map[Quality]TranscodeStream),
	}, nil
}

func GetKeyframes(path string) ([]float64, bool, error) {
	// run ffprobe to return all IFrames, IFrames are points where we can split the video in segments.
	out, err := exec.Command(
		"ffprobe",
		"-loglevel", "error",
		"-select_streams", "v:0",
		"-show_entries", "packet=pts_time,flags",
		"-of", "csv=print_section=0",
		path,
	).Output()
	// We ask ffprobe to return the time of each frame and it's flags
	// We could ask it to return only i-frames (keyframes) with the -skip_frame nokey but using it is extremly slow
	// since ffmpeg parses every frames when this flag is set.
	if err != nil {
		return nil, false, err
	}

	ret := make([]float64, 0, 300)
	last := 0.
	can_transmux := true
	for _, frame := range strings.Split(string(out), "\n") {
		x := strings.Split(frame, ",")
		pts, flags := x[0], x[1]

		// Only take keyframes
		if flags[0] != 'K' {
			continue
		}

		fpts, err := strconv.ParseFloat(pts, 64)
		if err != nil {
			return nil, false, err
		}

		// Only save keyframes with at least 3s betweens, we dont want a segment of 0.2s
		if fpts-last < 3 {
			continue
		}

		// If we have a segment of more than 20s, create new keyframes during transcode and disable transmuxing
		if fpts-last > 20 {
			can_transmux = false

			fake_count := math.Ceil(fpts - last/4)
			duration := (fpts - last) / fake_count
			// let the last one be handled normally, this prevents floating points rounding
			for fake_count > 1 {
				fake_count--
				last = last + duration
				ret = append(ret, last)
			}
		}

		last = fpts
		ret = append(ret, fpts)
	}
	return ret, can_transmux, nil
}

func (fs *FileStream) IsDead() bool {
	for _, s := range fs.streams {
		if len(s.Clients) > 0 {
			return true
		}
	}
	return false
}

func (fs *FileStream) GetMaster() string {
	return ""
}
