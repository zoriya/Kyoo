package src

import (
	"bufio"
	"math"
	"os/exec"
	"strconv"
	"strings"
)

func GetKeyframes(path string) ([]float64, bool, error) {
	defer printExecTime("ffprobe analysis for %s", path)()
	// run ffprobe to return all IFrames, IFrames are points where we can split the video in segments.
	// We ask ffprobe to return the time of each frame and it's flags
	// We could ask it to return only i-frames (keyframes) with the -skip_frame nokey but using it is extremly slow
	// since ffmpeg parses every frames when this flag is set.
	cmd := exec.Command(
		"ffprobe",
		"-loglevel", "error",
		"-select_streams", "v:0",
		"-show_entries", "packet=pts_time,flags",
		"-of", "csv=print_section=0",
		path,
	)
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return nil, false, err
	}
	err = cmd.Start()
	if err != nil {
		return nil, false, err
	}

	scanner := bufio.NewScanner(stdout)

	ret := make([]float64, 0, 1000)
	for scanner.Scan() {
		frame := scanner.Text()
		if frame == "" {
			continue
		}

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

		// Before, we wanted to only save keyframes with at least 3s betweens
		// to prevent segments of 0.2s but sometimes, the -f segment muxer discards
		// the segment time and decide to cut at a random keyframe. Having every keyframe
		// handled as a segment prevents that.

		if len(ret) == 0 {
			// sometimes, videos can start at a timing greater than 0:00. We need to take that into account
			// and only list keyframes that come after the start of the video (without that, our segments count
			// mismatch and we can have the same segment twice on the stream).

			// we hardcode 0 as the first keyframe (even if this is fake) because it makes the code way easier to follow.
			// this value is actually never sent to ffmpeg anyways.
			ret = append(ret, 0)
			continue
		}
		ret = append(ret, fpts)
	}
	return ret, can_transmux, nil
}
