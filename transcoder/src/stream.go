package src

import (
	"bufio"
	"context"
	"errors"
	"fmt"
	"log/slog"
	"math"
	"os"
	"path/filepath"
	"slices"
	"strings"
	"sync"
	"time"

	"github.com/zoriya/kyoo/transcoder/src/exec"
)

// ErrSegmentOutOfRange is returned by GetSegment when the requested segment
// index does not exist (negative or past the last available segment).
var ErrSegmentOutOfRange = errors.New("segment out of range")

type Flags int32

const (
	AudioF   Flags = 1 << 0
	VideoF   Flags = 1 << 1
	CopyF    Flags = 1 << 2
	Transmux Flags = 1 << 3
)

type StreamHandle interface {
	getTranscodeArgs(segments string) []string
	getOutPath(encoder_id int) string
	// getInitPath returns the path of the shared fMP4 initialization segment
	// (ftyp+moov) referenced by #EXT-X-MAP for this stream/quality.
	getInitPath() string
	getFlags() Flags
}

type Stream struct {
	handle    StreamHandle
	ready     sync.WaitGroup
	file      *FileStream
	keyframes *Keyframe
	segments  []Segment
	heads     []Head
	// the lock used for the the heads
	lock sync.RWMutex
	// guards the on-demand generation of the shared init segment.
	initLock sync.Mutex
}

type Segment struct {
	// channel open if the segment is not ready. closed if ready.
	// one can check if segment 1 is open by doing:
	//
	//  ts.isSegmentReady(1).
	//
	// You can also wait for it to be ready (non-blocking if already ready) by doing:
	//  <-ts.segments[i]
	channel chan (struct{})
	encoder int
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

func NewStream(file *FileStream, keyframes *Keyframe, handle StreamHandle, ret *Stream) {
	ret.handle = handle
	ret.file = file
	ret.keyframes = keyframes
	ret.heads = make([]Head, 0)

	ret.ready.Add(1)
	go func() {
		keyframes.info.ready.Wait()

		length, is_done := keyframes.Length()
		ret.segments = make([]Segment, length, max(length, 2000))
		for seg := range ret.segments {
			ret.segments[seg].channel = make(chan struct{})
		}

		if !is_done {
			keyframes.AddListener(func(keyframesLen int) {
				ret.lock.Lock()
				defer ret.lock.Unlock()
				old_length := len(ret.segments)
				if cap(ret.segments) > keyframesLen {
					ret.segments = ret.segments[:keyframesLen]
				} else {
					ret.segments = append(ret.segments, make([]Segment, keyframesLen-old_length)...)
				}
				for seg := old_length; seg < keyframesLen; seg++ {
					ret.segments[seg].channel = make(chan struct{})
				}
			})
		}
		ret.ready.Done()
	}()
}

// Remember to lock before calling this.
func (ts *Stream) isSegmentReady(segment int32) bool {
	select {
	case <-ts.segments[segment].channel:
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

func toSegmentStr(segments []float64) string {
	return strings.Join(Map(segments, func(seg float64, _ int) string {
		return fmt.Sprintf("%.6f", seg)
	}), ",")
}

func (ts *Stream) run(ctx context.Context, start int32) error {
	ctx = context.WithoutCancel(ctx)
	// Start the transcode up to the 100th segment (or less)
	length, is_done := ts.keyframes.Length()
	end := min(start+100, length)
	// if keyframes analysys is not finished, always have a 1-segment padding
	// for the extra segment needed for precise split (look comment before -to flag)
	if !is_done {
		end -= 2
	}
	// Stop at the first finished segment
	ts.lock.Lock()
	// ts.segments is grown by the keyframe listener and can momentarily lag
	// behind keyframes.Length() while the analysis is still running. Clamp end to
	// the number of allocated segments so the loop below never indexes out of
	// range (that would panic while holding the lock and deadlock the stream).
	if end > int32(len(ts.segments)) {
		end = int32(len(ts.segments))
	}
	for i := start; i < end; i++ {
		if ts.isSegmentReady(i) || ts.isSegmentTranscoding(i) {
			end = i
			break
		}
	}
	if start >= end {
		// this can happens if the start segment was finished between the check
		// to call run() and the actual call.
		// since most checks are done in a RLock() instead of a Lock() this can
		// happens when two goroutines try to make the same segment ready
		ts.lock.Unlock()
		return nil
	}
	encoder_id := len(ts.heads)
	ts.heads = append(ts.heads, Head{segment: start, end: end, command: nil})
	ts.lock.Unlock()

	slog.InfoContext(ctx, "starting transcode", "encoderId", encoder_id, "path", ts.file.Info.Path, "start", start, "end", end, "length", length)

	copy_audio := ts.handle.getFlags()&(AudioF|CopyF) == (AudioF | CopyF)

	// Include both the start and end delimiter because -ss and -to are not accurate
	// Having an extra segment allows us to cut precisely the segments we want with the
	// -f segment that does cut the begining and the end at the keyframe like asked
	start_ref := float64(0)
	start_segment := start
	if start != 0 {
		// we always take on segment before the current one, for different reasons for audio/video:
		//  - Audio: we need context before the starting point, without that ffmpeg doesnt know what to do and leave ~100ms of silence
		//  - Video: if a segment is really short (between 20 and 100ms), the padding given in the else block bellow is not enough and
		// the previous segment is played another time. the -segment_times is way more precise so it does not do the same with this one
		if !copy_audio {
			// For copied audio we rely on output-side seeking to avoid drift between
			// independent invocations. Start exactly at the requested segment.
			start_segment = start - 1
		}
		if ts.handle.getFlags()&AudioF != 0 {
			start_ref = ts.keyframes.Get(start_segment)
		} else {
			// the param for the -ss takes the keyframe before the specificed time
			// (if the specified time is a keyframe, it either takes that keyframe or the one before)
			// to prevent this weird behavior, we specify a bit after the keyframe that interest us

			// this can't be used with audio since we need to have context before the start-time
			// without this context, the cut loses a bit of audio (audio gap of ~100ms)
			if start_segment+1 == length {
				start_ref = (ts.keyframes.Get(start_segment) + float64(ts.file.Info.Duration)) / 2
			} else {
				start_ref = (ts.keyframes.Get(start_segment) + ts.keyframes.Get(start_segment+1)) / 2
			}
		}
	}
	end_padding := int32(1)
	if end == length {
		end_padding = 0
	} else if copy_audio {
		// Copy-audio runs keep one extra overlap segment because we drop it
		end_padding += 1
	}
	segments := ts.keyframes.Slice(start_segment+1, end+end_padding)
	if len(segments) == 0 {
		// we can't leave that empty else ffmpeg errors out.
		segments = []float64{9999999}
	}

	outpath := ts.handle.getOutPath(encoder_id)
	err := os.MkdirAll(filepath.Dir(outpath), 0o755)
	if err != nil {
		return err
	}

	args := []string{
		"-nostats", "-hide_banner", "-loglevel", "warning",
	}

	if ts.handle.getFlags()&VideoF != 0 {
		args = append(args, Settings.HwAccel.DecodeFlags...)
	}

	if start_ref != 0 {
		if ts.handle.getFlags()&VideoF != 0 {
			// This is the default behavior in transmux mode and needed to force pre/post segment to work
			// This must be disabled when processing only audio because it creates gaps in audio
			args = append(args, "-noaccurate_seek")
		}
		args = append(args,
			"-ss", fmt.Sprintf("%.6f", start_ref),
		)
	}
	// do not include -to if we want the file to go to the end
	if end+1 < length && !copy_audio {
		// sometimes, the duration is shorter than expected (only during transcode it seems)
		// always include more and use the -f segment to split the file where we want
		end_ref := ts.keyframes.Get(end + 1)
		// it seems that the -to is confused when -ss seek before the given time (because it searches for a keyframe)
		// add back the time that would be lost otherwise
		// this only appens when -to is before -i but having -to after -i gave a bug (not sure, don't remember)
		if start_ref != 0 {
			end_ref += start_ref - ts.keyframes.Get(start_segment)
		}
		args = append(args,
			"-to", fmt.Sprintf("%.6f", end_ref),
		)
	}
	args = append(args,
		// some avi files are missing pts, using this flag makes ffmpeg use dts as pts and prevents an error with
		// -c:v copy. Only issue: pts is sometime wrong (+1fps than expected) and this leads to some clients refusing
		// to play the file (they just switch back to the previous quality).
		// since this is better than errorring or not supporting transmux at all, i'll keep it here for now.
		"-fflags", "+genpts",
		"-i", ts.file.Info.Path,
		// for hls streams, -copyts is mandatory
		"-copyts",
		// this makes output file start at 0s instead of a random delay + the -ss value
		// this also cancel -start_at_zero weird delay.
		// this is not always respected but generally it gives better results.
		// even when this is not respected, it does not result in a bugged experience but this is something
		// to keep in mind when debugging
		"-muxdelay", "0",
	)
	if copy_audio {
		if start_ref != 0 {
			args = append(args,
				"-ss", fmt.Sprintf("%.6f", start_ref),
			)
		}
		if end+1 < length {
			duration := ts.keyframes.Get(end+1) - ts.keyframes.Get(start_segment)
			args = append(args,
				"-t", fmt.Sprintf("%.6f", duration),
			)
		}
		args = append(args, "-copytb", "1")
		if start_ref != 0 {
			// output-side seek on copied audio can rebase timestamps at 0 for each invocation.
			// reapply an absolute offset so all lazy windows stay in a single timeline.
			args = append(args,
				"-output_ts_offset", fmt.Sprintf("%.6f", start_ref),
			)
		}
	} else {
		// this makes behaviors consistent between soft and hardware decodes.
		// this also means that after a -ss 50, the output video will start at 50s
		args = append(args, "-start_at_zero")
	}
	args = append(args, ts.handle.getTranscodeArgs(toSegmentStr(segments))...)
	args = append(args,
		"-f", "segment",
		// needed for rounding issues when forcing keyframes
		// recommended value is 1/(2*frame_rate), which for a 24fps is ~0.021
		// we take a little bit more than that to be extra safe but too much can be harmfull
		// when segments are short (can make the video repeat itself)
		"-segment_time_delta", "0.05",
		// fMP4 segments. Each output file is a self-contained fragmented mp4
		// (ftyp+moov+sidx+moof+mdat+mfra). We extract a single shared init
		// (ftyp+moov) separately and strip every served segment down to
		// moof+mdat (see finalizeSegment / mp4.go). default_base_moof makes each
		// moof self-referential so the strip keeps sample offsets valid.
		"-segment_format", "mp4",
		"-segment_format_options", "movflags=frag_keyframe+empty_moov+default_base_moof",
		"-segment_times", toSegmentStr(Map(segments, func(seg float64, _ int) float64 {
			// segment_times want durations, not timestamps so we must substract the -ss param
			// since we give a greater value to -ss to prevent wrong seeks but -segment_times
			// needs precise segments, we use the actual -ss value as a reference.
			return seg - start_ref
		})),
		"-segment_list_type", "flat",
		"-segment_list", "pipe:1",
		"-segment_start_number", fmt.Sprint(start_segment),
		outpath,
	)

	cmd := exec.CommandContext(ctx, "ffmpeg", args...)
	slog.InfoContext(ctx, "running ffmpeg", "args", strings.Join(cmd.Args, " "))

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

	go func(ctx context.Context) {
		scanner := bufio.NewScanner(stdout)
		format := filepath.Base(outpath)
		should_stop := false

		for scanner.Scan() {
			var segment int32
			_, _ = fmt.Sscanf(scanner.Text(), format, &segment)

			if segment < start {
				// This happen because we use -f segments for accurate cutting (since -ss is not)
				// check comment at begining of function for more info
				continue
			}
			// The segment list pipe reports a file only once it is closed, so the
			// raw fMP4 file is complete here. Rewrite it in place to the served
			// shape (strip ftyp/moov/sidx/mfra, patch tfdt to absolute decode
			// time) before marking it ready. Done outside the lock to avoid disk
			// IO under the heads lock; the file is unique per (encoder, segment)
			// so there is no concurrent writer. A failure here just skips marking
			// the segment ready, letting a future request re-encode it.
			segPath := fmt.Sprintf(ts.handle.getOutPath(encoder_id), segment)
			if err := ts.finalizeSegment(segPath, segment); err != nil {
				slog.ErrorContext(ctx, "failed to finalize fmp4 segment", "segment", segment, "encoderId", encoder_id, "err", err)
				continue
			}
			ts.lock.Lock()
			if ts.heads[encoder_id] == DeletedHead {
				// The head was killed from the outside (the orphaned-head reaper in
				// tracker.go or a stream teardown) while ffmpeg was in the middle of
				// writing this segment. On SIGINT, ffmpeg flushes and closes the
				// partial segment it was working on and still emits it on the segment
				// list pipe. Marking such a truncated segment as ready would serve it
				// forever and break ABR continuity (a later, complete encode can never
				// replace an already-ready segment). Drop it: a future request will
				// re-encode it cleanly.
				ts.lock.Unlock()
				return
			}
			ts.heads[encoder_id].segment = segment
			slog.InfoContext(ctx, "segment got ready", "segment", segment, "encoderId", encoder_id)
			if ts.isSegmentReady(segment) {
				// the current segment is already marked at done so another process has already gone up to here.
				cmd.Process.Signal(os.Interrupt)
				slog.InfoContext(ctx, "killing ffmpeg because segment already ready", "segment", segment, "encoderId", encoder_id)
				should_stop = true
			} else if end < length-1 && segment == end {
				// Extra overlap segment used for accurate cuts.
				// Ignore it so a future request can create it cleanly if needed.
				extraPath := fmt.Sprintf(ts.handle.getOutPath(encoder_id), segment)
				_ = os.Remove(extraPath)
				should_stop = true
			} else {
				ts.segments[segment].encoder = encoder_id
				close(ts.segments[segment].channel)
				if segment == end-1 {
					// file finished, ffmped will finish soon on it's own
					should_stop = true
				} else if ts.isSegmentReady(segment + 1) {
					cmd.Process.Signal(os.Interrupt)
					slog.InfoContext(ctx, "killing ffmpeg because next segment is ready", "segment", segment, "encoderId", encoder_id)
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
			slog.WarnContext(ctx, "error reading ffmpeg stdout", "err", err)
		}
	}(ctx)

	go func(ctx context.Context) {
		err := cmd.Wait()
		if exiterr, ok := err.(*exec.ExitError); ok && exiterr.ExitCode() == 255 {
			slog.InfoContext(ctx, "ffmpeg was killed by us", "encoderId", encoder_id)
		} else if err != nil {
			slog.ErrorContext(ctx, "ffmpeg occured an error", "encoderId", encoder_id, "err", err, "stderr", stderr.String())
		} else {
			slog.InfoContext(ctx, "ffmpeg finished successfully", "encoderId", encoder_id)
		}

		ts.lock.Lock()
		defer ts.lock.Unlock()
		// we can't delete the head directly because it would invalidate the others encoder_id
		ts.heads[encoder_id] = DeletedHead
	}(ctx)

	return nil
}

// finalizeSegment rewrites a raw fMP4 segment file produced by the segment muxer
// into the form served to clients: only moof+mdat, with the tfdt
// baseMediaDecodeTime patched to the segment's absolute decode time. The segment
// muxer rebases every segment to decode time 0; patching it keeps a single
// continuous timeline across independent lazy-window encodes (mirroring how
// -copyts kept absolute PTS in the old MPEG-TS path).
func (ts *Stream) finalizeSegment(path string, segment int32) error {
	data, err := os.ReadFile(path)
	if err != nil {
		return err
	}
	timescale, err := readMediaTimescale(data)
	if err != nil {
		return err
	}
	frags, err := stripToFragments(data)
	if err != nil {
		return err
	}
	decodeTime := uint64(math.Round(ts.keyframes.Get(segment) * float64(timescale)))
	if err := patchBaseMediaDecodeTime(frags, decodeTime); err != nil {
		return err
	}
	return os.WriteFile(path, frags, 0o644)
}

// GetInit lazily generates and returns the path of the shared fMP4 init segment
// (ftyp+moov) for this stream/quality. The moov only depends on the (fixed)
// codec parameters, not on the encode start point, so we produce it with a short
// dedicated ffmpeg run decoupled from the lazy windows. This matters because the
// player fetches the #EXT-X-MAP init before requesting any media segment.
func (ts *Stream) GetInit(ctx context.Context) (string, error) {
	ctx = context.WithoutCancel(ctx)
	initPath := ts.handle.getInitPath()

	ts.initLock.Lock()
	defer ts.initLock.Unlock()
	if _, err := os.Stat(initPath); err == nil {
		return initPath, nil
	}
	if err := os.MkdirAll(filepath.Dir(initPath), 0o755); err != nil {
		return "", err
	}

	args := []string{"-nostats", "-hide_banner", "-loglevel", "warning"}
	if ts.handle.getFlags()&VideoF != 0 {
		args = append(args, Settings.HwAccel.DecodeFlags...)
	}
	args = append(args, "-i", ts.file.Info.Path)
	// "0" is a dummy -force_key_frames value: we discard the media and keep the moov.
	args = append(args, ts.handle.getTranscodeArgs("0")...)
	tmp := fmt.Sprintf("%s.%d.tmp", initPath, os.Getpid())
	args = append(args,
		// just enough output to emit the moov header.
		"-t", "0.5",
		"-movflags", "frag_keyframe+empty_moov+default_base_moof",
		"-f", "mp4",
		tmp,
	)

	cmd := exec.CommandContext(ctx, "ffmpeg", args...)
	slog.InfoContext(ctx, "generating fmp4 init segment", "args", strings.Join(cmd.Args, " "))
	var stderr strings.Builder
	cmd.Stderr = &stderr
	if err := cmd.Run(); err != nil {
		_ = os.Remove(tmp)
		return "", fmt.Errorf("could not generate init segment: %w (%s)", err, stderr.String())
	}
	defer os.Remove(tmp)

	data, err := os.ReadFile(tmp)
	if err != nil {
		return "", err
	}
	init, err := extractInitSegment(data)
	if err != nil {
		return "", err
	}
	if err := os.WriteFile(initPath, init, 0o644); err != nil {
		return "", err
	}
	return initPath, nil
}

func (ts *Stream) GetIndex(_ context.Context, client string) (string, error) {
	// playlist type is event since we can append to the list if Keyframe.IsDone is false.
	// start time offset makes the stream start at 0s instead of ~3segments from the end (requires version 6 of hls)
	// version 7 is required for fMP4 segments (#EXT-X-MAP referencing an init segment).
	index := fmt.Sprintf(`#EXTM3U
#EXT-X-VERSION:7
#EXT-X-PLAYLIST-TYPE:EVENT
#EXT-X-START:TIME-OFFSET=0
#EXT-X-TARGETDURATION:4
#EXT-X-MEDIA-SEQUENCE:0
#EXT-X-INDEPENDENT-SEGMENTS
#EXT-X-MAP:URI="init.mp4?clientId=%s"
`, client)
	length, is_done := ts.keyframes.Length()

	for segment := int32(0); segment < length-1; segment++ {
		index += fmt.Sprintf("#EXTINF:%.6f\n", ts.keyframes.Get(segment+1)-ts.keyframes.Get(segment))
		index += fmt.Sprintf("segment-%d.mp4?clientId=%s\n", segment, client)
	}
	// do not forget to add the last segment between the last keyframe and the end of the file
	// if the keyframes extraction is not done, do not bother to add it, it will be retrived on the next index retrival
	if is_done && length > 0 {
		index += fmt.Sprintf("#EXTINF:%.6f\n", float64(ts.file.Info.Duration)-ts.keyframes.Get(length-1))
		index += fmt.Sprintf("segment-%d.mp4?clientId=%s\n", length-1, client)
		index += `#EXT-X-ENDLIST`
	}
	return index, nil
}

func (ts *Stream) GetSegment(ctx context.Context, segment int32) (string, error) {
	ctx = context.WithoutCancel(ctx)
	ts.lock.RLock()
	if segment < 0 || int(segment) >= len(ts.segments) {
		ts.lock.RUnlock()
		return "", ErrSegmentOutOfRange
	}
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
	}
	readyChan := ts.segments[segment].channel
	ts.lock.RUnlock()

	if !ready {
		// Only start a new encode if there is too big a distance between the current encoder and the segment.
		if distance > 60 || !is_scheduled {
			slog.InfoContext(ctx, "creating new head", "segment", segment, "distance", distance)
			err := ts.run(ctx, segment)
			if err != nil {
				return "", err
			}
		} else {
			slog.InfoContext(ctx, "waiting for segment", "segment", segment, "distance", distance)
		}

		select {
		case <-readyChan:
		case <-time.After(60 * time.Second):
			return "", errors.New("could not retrive the selected segment (timeout)")
		}
	}
	ts.prerareNextSegements(ctx, segment)
	ts.lock.RLock()
	encoder := ts.segments[segment].encoder
	ts.lock.RUnlock()
	return fmt.Sprintf(ts.handle.getOutPath(encoder), segment), nil
}

func (ts *Stream) prerareNextSegements(ctx context.Context, segment int32) {
	ctx = context.WithoutCancel(ctx)
	// Audio is way cheaper to create than video so we don't need to run them in advance
	// Running it in advance might actually slow down the video encode since less compute
	// power can be used so we simply disable that.
	if ts.handle.getFlags()&VideoF == 0 {
		return
	}
	ts.lock.RLock()
	defer ts.lock.RUnlock()
	for i := segment + 1; i <= min(segment+10, int32(len(ts.segments)-1)); i++ {
		if ts.isSegmentReady(i) {
			continue
		}
		// only start encode for segments not planned (getMinEncoderDistance returns Inf for them)
		// or if they are 60s away (asume 5s per segments)
		if ts.getMinEncoderDistance(i) < 60+(5*float64(i-segment)) {
			continue
		}
		slog.InfoContext(ctx, "creating new head for future segment", "segment", i)
		go ts.run(ctx, i)
		return
	}
}

func (ts *Stream) getMinEncoderDistance(segment int32) float64 {
	time := ts.keyframes.Get(segment)
	distances := Map(ts.heads, func(head Head, _ int) float64 {
		// ignore killed heads or heads after the current time
		if head.segment < 0 || ts.keyframes.Get(head.segment) > time || segment >= head.end {
			return math.Inf(1)
		}
		return time - ts.keyframes.Get(head.segment)
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
	if ts.heads[encoder_id] == DeletedHead || ts.heads[encoder_id].command == nil {
		return
	}
	ts.heads[encoder_id].command.Process.Signal(os.Interrupt)
	ts.heads[encoder_id] = DeletedHead
}
