package src

import (
	"bufio"
	"errors"
	"fmt"
	"log"
	"math"
	"os"
	"os/exec"
	"path/filepath"
	"slices"
	"strings"
	"sync"
	"time"
)

type StreamHandle interface {
	getTranscodeArgs(segments string) []string
	getOutPath() string
}

type Stream struct {
	handle StreamHandle
	file   *FileStream
	// channel open if the segment is not ready. closed if ready.
	// one can check if segment 1 is open by doing:
	//
	//  ts.isSegmentReady(1).
	//
	// You can also wait for it to be ready (non-blocking if already ready) by doing:
	//  <-ts.segments[i]
	segments []chan (struct{})
	heads    []Head
	// the lock used for the segments array and the heads
	lock sync.RWMutex
}

type Head struct {
	segment int32
	end     int32
	command *exec.Cmd
}

var DeletedHead = Head{
	segment: -1,
	end:     -1,
	command: nil,
}

func NewStream(file *FileStream, handle StreamHandle) Stream {
	ret := Stream{
		handle:   handle,
		file:     file,
		segments: make([]chan struct{}, len(file.Keyframes)),
		heads:    make([]Head, 0),
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
	case <-ts.segments[segment]:
		// if the channel returned, it means it was closed
		return true
	default:
		return false
	}
}

func (ts *Stream) isSegmentTranscoding(segment int32) bool {
	for _, head := range ts.heads {
		if head.segment == segment {
			return true
		}
	}
	return false
}

func (ts *Stream) run(start int32) error {
	// Start the transcode up to the 100th segment (or less)
	// Stop at the first finished segment
	end := min(start+100, int32(len(ts.file.Keyframes))-1)
	ts.lock.Lock()
	for i := start; i < end; i++ {
		if ts.isSegmentReady(i) {
			end = i
			break
		}
	}
	encoder_id := len(ts.heads)
	ts.heads = append(ts.heads, Head{segment: start, end: end, command: nil})
	ts.lock.Unlock()

	log.Printf(
		"Starting transcode for %s (from %d to %d out of %d segments)",
		ts.file.Path,
		start,
		end,
		len(ts.file.Keyframes),
	)

	var segments_str string
	if end-start-1 > 0 {
		// We do not need the first value (start of the transcode)
		// nor the last one (end of the -to argument)
		// if we specify one of those, ffmpeg creates a really small segment and
		// we miss a segment's worth of data
		segments := make([]string, end-start-1)
		for i := range segments {
			time := ts.file.Keyframes[int(start)+i+1] - ts.file.Keyframes[start]
			segments[i] = fmt.Sprintf("%.6f", time)
		}
		segments_str = strings.Join(segments, ",")
	} else {
		// we set a dummy value when we want to have a single segment.
		// this can't be left empty else ffmpeg errors out
		// this can't be the length of the file else ffmpeg risk creating a second segment
		segments_str = "9999999999"
	}

	outpath := ts.handle.getOutPath()
	err := os.MkdirAll(filepath.Dir(outpath), 0o755)
	if err != nil {
		return err
	}

	args := []string{
		"-nostats", "-hide_banner", "-loglevel", "warning",

		"-ss", fmt.Sprintf("%.6f", ts.file.Keyframes[start]),
		"-i", ts.file.Path,
		"-copyts",
	}
	// do not include -to if we want the file to go to the end
	if end != int32(len(ts.file.Keyframes)) {
		args = append(args,
			"-to", fmt.Sprintf("%.6f", ts.file.Keyframes[end]),
		)
	}
	args = append(args, ts.handle.getTranscodeArgs(segments_str)...)
	args = append(args, []string{
		"-f", "segment",
		"-segment_time_delta", "0.2",
		"-segment_format", "mpegts",
		"-segment_times", segments_str,
		"-segment_start_number", fmt.Sprint(start),
		"-segment_list_type", "flat",
		"-segment_list", "pipe:1",
		outpath,
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
	ts.heads[encoder_id].command = cmd
	ts.lock.Unlock()

	go func() {
		scanner := bufio.NewScanner(stdout)
		format := filepath.Base(outpath)
		should_stop := false

		for scanner.Scan() {
			var segment int32
			_, _ = fmt.Sscanf(scanner.Text(), format, &segment)

			ts.lock.Lock()
			ts.heads[encoder_id].segment = segment
			if ts.isSegmentReady(segment) {
				// the current segment is already marked at done so another process has already gone up to here.
				cmd.Process.Signal(os.Interrupt)
				log.Printf("Killing ffmpeg because segment %d is already ready", segment)
				should_stop = true
			} else {
				close(ts.segments[segment])
				if int32(len(ts.segments)) == segment+1 {
					// file finished, ffmped will finish soon on it's own
					should_stop = true
				} else if ts.isSegmentReady(segment + 1) {
					cmd.Process.Signal(os.Interrupt)
					log.Printf("Killing ffmpeg because next segment %d is ready", segment)
					should_stop = true
				}
			}
			ts.lock.Unlock()
			// we need this and not a return in the condition because we want to unlock
			// the lock (and can't defer since this is a loop)
			if should_stop {
				return
			}
		}

		if err := scanner.Err(); err != nil {
			log.Println("Error reading stdout of ffmpeg", err)
		}
	}()

	go func() {
		err := cmd.Wait()
		if exiterr, ok := err.(*exec.ExitError); ok && exiterr.ExitCode() == 255 {
			log.Println("ffmpeg was killed by us")
		} else if err != nil {
			log.Println("ffmpeg occured an error", err, stderr.String())
		} else {
			log.Println("ffmpeg finished successfully")
		}

		ts.lock.Lock()
		defer ts.lock.Unlock()
		// we can't delete the head directly because it would invalidate the others encoder_id
		ts.heads[encoder_id] = DeletedHead
	}()

	return nil
}

func (ts *Stream) GetIndex() (string, error) {
	index := `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-PLAYLIST-TYPE:VOD
#EXT-X-ALLOW-CACHE:YES
#EXT-X-TARGETDURATION:4
#EXT-X-MEDIA-SEQUENCE:0
#EXT-X-INDEPENDENT-SEGMENTS
`

	for segment := 0; segment < len(ts.file.Keyframes)-1; segment++ {
		index += fmt.Sprintf("#EXTINF:%.6f\n", ts.file.Keyframes[segment+1]-ts.file.Keyframes[segment])
		index += fmt.Sprintf("segment-%d.ts\n", segment)
	}
	index += `#EXT-X-ENDLIST`
	return index, nil
}

func (ts *Stream) GetSegment(segment int32) (string, error) {
	ts.lock.RLock()
	ready := ts.isSegmentReady(segment)
	// we want to calculate distance in the same lock else it can be funky
	distance := 0.
	is_scheduled := false
	if !ready {
		distance = ts.getMinEncoderDistance(segment)
		for _, head := range ts.heads {
			if head.segment <= segment && segment < head.end {
				is_scheduled = true
				break
			}
		}
	} else if !ts.isSegmentTranscoding(segment) {
		// if the current segment is ready, check next segments are ready and if not start a transcode for them
		for i := segment + 1; i <= min(segment+10, int32(len(ts.segments)-1)); i++ {
			if ts.isSegmentTranscoding(i) {
				// no need to create a new transcoder if there is already one running for this segment
				break
			}
			if !ts.isSegmentReady(i) {
				log.Printf("Creating new head for future segment (%d)", i)
				go ts.run(i)
				break
			}
		}
	}
	ts.lock.RUnlock()

	if !ready {
		// Only start a new encode if there is too big a distance between the current encoder and the segment.
		if distance > 60 || !is_scheduled {
			log.Printf("Creating new head for %d since closest head is %fs aways", segment, distance)
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

		select {
		case <-ready_chan:
		case <-time.After(60 * time.Second):
			return "", errors.New("could not retrive the selected segment (timeout)")
		}
	}
	return fmt.Sprintf(ts.handle.getOutPath(), segment), nil
}

func (ts *Stream) getMinEncoderDistance(segment int32) float64 {
	time := ts.file.Keyframes[segment]
	distances := Map(ts.heads, func(head Head, _ int) float64 {
		// ignore killed heads or heads after the current time
		if head.segment < 0 || ts.file.Keyframes[head.segment] > time {
			return math.Inf(1)
		}
		return time - ts.file.Keyframes[head.segment]
	})
	if len(distances) == 0 {
		return math.Inf(1)
	}
	return slices.Min(distances)
}

func (ts *Stream) Kill() {
	ts.lock.Lock()
	defer ts.lock.Unlock()

	for id := range ts.heads {
		ts.KillHead(id)
	}
}

// Stream assume to be locked
func (ts *Stream) KillHead(encoder_id int) {
	if ts.heads[encoder_id] == DeletedHead {
		return
	}
	ts.heads[encoder_id].command.Process.Signal(os.Interrupt)
	ts.heads[encoder_id] = DeletedHead
}
