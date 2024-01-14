package src

import (
	"context"
	"fmt"
	"log"
	"os/exec"
	"strings"
	"sync"
)

func Min(a int32, b int32) int32 {
	if a < b {
		return a
	}
	return b
}

type TranscodeStream interface {
	getTranscodeArgs(segments string) []string
	getOutPath() string
}

type Stream struct {
	TranscodeStream
	file    *FileStream
	Clients []string
	// true if the segment at given index is completed/transcoded, false otherwise
	segments []bool
	// the lock used for the segments array
	lock sync.RWMutex
	ctx  context.Context
	// TODO: add ffmpeg process
}

func (ts *Stream) run(start int32, end int32) error {
	log.Printf(
		"Starting transcode for %s (from %d to %d out of %d segments)",
		ts.file.Path,
		start,
		end,
		len(ts.file.Keyframes),
	)

	// We do not need the first value (start of the transcode)
	segments := make([]string, end-start-1)
	for i := range segments {
		segments[i] = fmt.Sprintf("%.6f", ts.file.Keyframes[int(start)+i+1])
	}
	segments_str := strings.Join(segments, ",")

	args := []string{
		"-nostats", "-hide_banner", "-loglevel", "warning",
		"-copyts",

		"-ss", fmt.Sprintf("%.6f", ts.file.Keyframes[start]),
		"-to", fmt.Sprintf("%.6f", ts.file.Keyframes[end]),
		"-i", ts.file.Path,
	}
	args = append(args, ts.getTranscodeArgs(segments_str)...)
	args = append(args, []string{
		"-f", "segment",
		"-segment_time_delta", "0.2",
		"-segment_format", "mpegts",
		"-segment_times", segments_str,
		"-segment_start_number", fmt.Sprint(start),
		"-segment_list_type", "flat",
		"-segment_list", "pipe:1",
		ts.getOutPath(),
	}...)

	cmd := exec.CommandContext(
		ts.ctx,
		"ffmpeg",
		args...,
	)
	log.Printf("Running %s", strings.Join(cmd.Args, " "))

	return nil
}

func (ts *Stream) GetIndex(client string) (string, error) {
	index := `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-PLAYLIST-TYPE:VOD
#EXT-X-ALLOW-CACHE:YES
#EXT-X-TARGETDURATION:4
#EXT-X-MEDIA-SEQUENCE:0
`

	for segment := 1; segment < len(ts.file.Keyframes); segment++ {
		index += fmt.Sprintf("#EXTINF:%.6f\n", ts.file.Keyframes[segment]-ts.file.Keyframes[segment-1])
		index += fmt.Sprintf("segment-%d.ts\n", segment)
	}
	index += `#EXT-X-ENDLIST`
	return index, nil
}
