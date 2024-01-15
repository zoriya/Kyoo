package src

import (
	"bufio"
	"fmt"
	"log"
	"math"
	"os"
	"os/exec"
	"slices"
	"strings"
	"sync"
)

type TranscodeStream interface {
	getTranscodeArgs(segments string) []string
	getOutPath() string
}

type Stream struct {
	TranscodeStream
	file    *FileStream
	Clients []string
	// channel open if the segment is not ready. closed if ready.
	// one can check if segment 1 is open by doing:
	//
	//  ts.isSegmentReady(1).
	//
	// You can also wait for it to be ready (non-blocking if already ready) by doing:
	//  <-ts.segments[i]
	segments []chan (struct{})
	heads    []int32
	commands []*exec.Cmd
	// the lock used for the segments array and the heads
	lock sync.RWMutex
}

func NewStream(file *FileStream) Stream {
	ret := Stream{
		file:     file,
		Clients:  make([]string, 0),
		segments: make([]chan struct{}, len(file.Keyframes)),
		heads:    make([]int32, 0),
		commands: make([]*exec.Cmd, 0),
	}
	for seg := range ret.segments {
		ret.segments[seg] = make(chan struct{})
	}
	// Copy default value before use is safe. Next warning can be safely ignored
	return ret
}

// Remember to lock before calling this.
func (ts *Stream) isSegmentReady(segment int32) bool {
	select {
	case _, ready := <-ts.segments[segment]:
		return ready
	default:
		return false
	}
}

func (ts *Stream) run(start int32) error {
	// Start the transcode up to the 100th segment (or less)
	// Stop at the first finished segment
	end := min(start+100, int32(len(ts.file.Keyframes)))
	ts.lock.RLock()
	for i := start; i < end; i++ {
		if ts.isSegmentReady(i) {
			end = i
			break
		}
	}
	encoder_id := len(ts.heads)
	ts.heads = append(ts.heads, start)
	// we set nil while the command has not started, this is just to reserve the index
	ts.commands = append(ts.commands, nil)
	ts.lock.RUnlock()

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

	cmd := exec.Command("ffmpeg", args...)
	log.Printf("Running %s", strings.Join(cmd.Args, " "))

	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return err
	}
	var stderr strings.Builder
	cmd.Stderr = &stderr

	err = cmd.Start()
	if err != nil {
		return err
	}
	ts.lock.Lock()
	ts.commands[encoder_id] = cmd
	ts.lock.Unlock()

	go func() {
		scanner := bufio.NewScanner(stdout)
		for scanner.Scan() {
			var segment int32
			_, _ = fmt.Sscanf(scanner.Text(), "segment-%d.ts", &segment)

			ts.lock.Lock()
			close(ts.segments[segment])
			ts.heads[encoder_id] = segment
			ts.lock.Unlock()

			if int32(len(ts.segments)) == segment+1 {
				// file finished, ffmped will finish soon on it's own
			} else if ts.isSegmentReady(segment + 1) {
				// ask ffmpeg to stop gracefully (nicer cmd.Process.Kill())
				cmd.Process.Signal(os.Interrupt)
			}
		}

		if err := scanner.Err(); err != nil {
			log.Println("Error reading stdout of ffmpeg", err)
		}
	}()

	go func() {
		err := cmd.Wait()
		if err != nil {
			log.Println("ffmpeg occured an error", err, stderr.String())
		} else {
			log.Println("ffmpeg finished successfully")
		}

		ts.lock.Lock()
		defer ts.lock.Unlock()
		// we can't delete the head directly because it would invalidate the others encoder_id
		ts.heads[encoder_id] = -1
		ts.commands[encoder_id] = nil
	}()

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

func (ts *Stream) GetSegment(segment int32, client string) (string, error) {
	ts.lock.RLock()
	ready := ts.isSegmentReady(segment)
	ts.lock.RUnlock()

	if !ready {
		// Only start a new encode if there is more than 10s between the current encoder and the segment.
		if distance := ts.getMinEncoderDistance(ts.file.Keyframes[segment]); distance > 10 {
			err := ts.run(segment)
			if err != nil {
				return "", err
			}
		} else {
			log.Printf("Waiting for segment %d since encoder head is %fs aways", segment, distance)
		}

		ts.lock.RLock()
		ready_chan := ts.segments[segment]
		ts.lock.RUnlock()

		<-ready_chan
	}
	return fmt.Sprintf(ts.getOutPath(), segment), nil
}

func (ts *Stream) getMinEncoderDistance(time float64) float64 {
	ts.lock.RLock()
	defer ts.lock.RUnlock()
	distances := Map(ts.heads, func(i int32, _ int) float64 {
		// ignore killed heads or heads after the current time
		if i < 0 || ts.file.Keyframes[i] > time {
			return math.Inf(1)
		}
		return ts.file.Keyframes[i] - time
	})
	if len(distances) == 0 {
		return math.Inf(1)
	}
	return slices.Min(distances)
}

func (ts *Stream) Kill() {
	ts.lock.Lock()
	defer ts.lock.Unlock()

	for _, cmd := range ts.commands {
		if cmd == nil {
			continue
		}
		cmd.Process.Signal(os.Interrupt)
	}
}
