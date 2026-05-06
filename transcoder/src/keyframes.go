package src

import (
	"bufio"
	"context"
	"errors"
	"fmt"
	"log/slog"
	"strconv"
	"strings"
	"sync"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/zoriya/kyoo/transcoder/src/exec"
	"github.com/zoriya/kyoo/transcoder/src/utils"
)

const (
	KeyframeVersion        = 2
	minParsedKeyframeTime  = 5.0 // seconds
	minParsedKeyframeCount = 3
)

type Keyframe struct {
	Keyframes []float64
	IsDone    bool
	info      *KeyframeInfo
}
type KeyframeInfo struct {
	ready     sync.WaitGroup
	mutex     sync.RWMutex
	listeners []func(keyframesLen int)
}

func (kf *Keyframe) Get(idx int32) float64 {
	kf.info.mutex.RLock()
	defer kf.info.mutex.RUnlock()
	return kf.Keyframes[idx]
}

func (kf *Keyframe) Slice(start int32, end int32) []float64 {
	if end <= start {
		return []float64{}
	}
	kf.info.mutex.RLock()
	defer kf.info.mutex.RUnlock()

	ref := kf.Keyframes[start:end]
	if kf.IsDone {
		return ref
	}
	// make a copy since we will continue to mutate the array.
	ret := make([]float64, end-start)
	copy(ret, ref)
	return ret
}

func (kf *Keyframe) Length() (int32, bool) {
	kf.info.mutex.RLock()
	defer kf.info.mutex.RUnlock()
	return int32(len(kf.Keyframes)), kf.IsDone
}

func (kf *Keyframe) add(values []float64) {
	kf.info.mutex.Lock()
	kf.Keyframes = append(kf.Keyframes, values...)
	newLen := len(kf.Keyframes)
	kf.info.mutex.Unlock()

	for _, listener := range kf.info.listeners {
		listener(newLen)
	}
}

func (kf *Keyframe) AddListener(callback func(keyframesLen int)) {
	kf.info.mutex.Lock()
	defer kf.info.mutex.Unlock()
	kf.info.listeners = append(kf.info.listeners, callback)
}

func (kf *Keyframe) Scan(src any) error {
	var arr []float64

	m := pgtype.NewMap()
	t, ok := m.TypeForValue(&arr)

	if !ok {
		return errors.New("failed to parse keyframes")
	}
	err := m.Scan(t.OID, pgtype.BinaryFormatCode, src.([]byte), &arr)
	if err != nil {
		return err
	}

	kf.Keyframes = arr
	kf.IsDone = true
	kf.info = &KeyframeInfo{}
	return nil
}

type KeyframeKey struct {
	Sha     string
	IsVideo bool
	Index   uint32
}

func (s *MetadataService) GetKeyframes(ctx context.Context, info *MediaInfo, isVideo bool, idx uint32) (*Keyframe, error) {
	info.lock.Lock()
	var ret *Keyframe
	if isVideo && info.Videos[idx].Keyframes != nil {
		ret = info.Videos[idx].Keyframes
	}
	if !isVideo && info.Audios[idx].Keyframes != nil {
		ret = info.Audios[idx].Keyframes
	}
	info.lock.Unlock()
	if ret != nil {
		return ret, nil
	}

	get_running, set := s.keyframeLock.Start(KeyframeKey{
		Sha:     info.Sha,
		IsVideo: isVideo,
		Index:   idx,
	})
	if get_running != nil {
		return get_running()
	}

	kf := &Keyframe{
		IsDone: false,
		info:   &KeyframeInfo{},
	}
	kf.info.ready.Add(1)

	info.lock.Lock()
	if isVideo {
		info.Videos[idx].Keyframes = kf
	} else {
		info.Audios[idx].Keyframes = kf
	}
	info.lock.Unlock()

	go func(ctx context.Context) {
		ctx = context.WithoutCancel(ctx)
		var table string
		var err error
		if isVideo {
			table = "gocoder.videos"
			err = getVideoKeyframes(ctx, info.Path, idx, kf)
		} else {
			table = "gocoder.audios"
			err = getAudioKeyframes(ctx, info, idx, kf)
		}

		if err != nil {
			slog.ErrorContext(ctx, "couldn't retrieve keyframes", "path", info.Path, "table", table, "idx", idx, "err", err)
			return
		}

		kf.info.ready.Wait()
		tx, _ := s.Database.Begin(ctx)
		tx.Exec(
			ctx,
			fmt.Sprintf(`update %s set keyframes = $3 where id = $1 and idx = $2`, table),
			info.Id,
			idx,
			kf.Keyframes,
		)
		tx.Exec(ctx, `update gocoder.info set ver_keyframes = $2 where id = $1`, info.Id, KeyframeVersion)
		err = tx.Commit(ctx)
		if err != nil {
			slog.ErrorContext(ctx, "couldn't store keyframes on database", "err", err)
		}
	}(ctx)
	return set(kf, nil)
}

// Retrieve video's keyframes and store them inside the kf var.
// Returns when all key frames are retrieved (or an error occurs)
// info.ready.Done() is called when more than 100 are retrieved (or extraction is done)
func getVideoKeyframes(ctx context.Context, path string, video_idx uint32, kf *Keyframe) error {
	defer utils.PrintExecTime(ctx, "ffprobe keyframe analysis for %s video n%d", path, video_idx)()
	// run ffprobe to return all IFrames, IFrames are points where we can split the video in segments.
	// We ask ffprobe to return the time of each frame and it's flags
	// We could ask it to return only i-frames (keyframes) with the -skip_frame nokey but using it is extremely slow
	// since ffmpeg parses every frames when this flag is set.
	cmd := exec.CommandContext(
		ctx,
		"ffprobe",
		"-loglevel", "error",
		"-select_streams", fmt.Sprintf("V:%d", video_idx),
		"-show_entries", "packet=pts_time,flags",
		// some avi files don't have pts, we use this to ask ffmpeg to generate them (it uses the dts under the hood)
		"-fflags", "+genpts",
		"-of", "csv=print_section=0",
		path,
	)
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return err
	}
	err = cmd.Start()
	if err != nil {
		return err
	}
	// we don't care about the result but await it for traces.
	go cmd.Wait()

	scanner := bufio.NewScanner(stdout)

	ret := make([]float64, 0, 1000)
	limit := 100
	done := 0
	notified := false

	// sometimes, videos can start at a timing greater than 0:00. We need to take that into account
	// and only list keyframes that come after the start of the video (without that, our segments count
	// mismatch and we can have the same segment twice on the stream).
	//
	// We can't hardcode the first keyframe at 0 because the transcoder needs to reference durations of segments
	// To handle this edge case, when we fetch the segment n0, no seeking is done but duration is computed from the
	// first keyframe (instead of 0)
	for scanner.Scan() {
		frame := scanner.Text()
		if frame == "" {
			continue
		}

		x := strings.Split(frame, ",")
		pts, flags := x[0], x[1]

		// true if there is no keyframes (e.g. in a file w/o video track)
		// can also happen if a video has more packets than frames (so the last packet
		// is emtpy and has a N/A pts)
		if pts == "N/A" {
			break
		}
		// Only take keyframes
		if flags[0] != 'K' {
			continue
		}

		fpts, err := strconv.ParseFloat(pts, 64)
		if err != nil {
			return err
		}

		// Before, we wanted to only save keyframes with at least 3s betweens
		// to prevent segments of 0.2s but sometimes, the -f segment muxer discards
		// the segment time and decide to cut at a random keyframe. Having every keyframe
		// handled as a segment prevents that.

		ret = append(ret, fpts)

		shouldNotify := !notified && fpts >= minParsedKeyframeTime && len(ret) >= minParsedKeyframeCount
		if len(ret) == limit || shouldNotify {
			kf.add(ret)
			if done == 0 {
				kf.info.ready.Done()
			} else if done >= 500 {
				limit = 500
			}
			done += limit
			// clear the array without reallocating it
			ret = ret[:0]

			notified = true
		}
	}
	kf.add(ret)
	kf.IsDone = true
	if done == 0 {
		kf.info.ready.Done()
	}
	return nil
}

// Audio keyframes are generated from packet timestamps, then snapped to a target cadence.
// This keeps segment boundaries packet-aligned (important for -c:a copy) while still
// aiming for roughly 4s segments.
func getAudioKeyframes(ctx context.Context, info *MediaInfo, audio_idx uint32, kf *Keyframe) error {
	defer utils.PrintExecTime(ctx, "ffprobe keyframe analysis for %s audio n%d", info.Path, audio_idx)()
	// We need packet-level timestamps so boundaries are valid even with stream copy.
	// Naive fixed boundaries (0,4,8,...) can drift since packets aren't necessary split at such timings
	// causing overlaps/gaps at head boundaries.
	cmd := exec.CommandContext(
		ctx,
		"ffprobe",
		"-loglevel", "error",
		"-select_streams", fmt.Sprintf("a:%d", audio_idx),
		"-show_entries", "packet=pts_time",
		// some avi files don't have pts, we use this to ask ffmpeg to generate them (it uses the dts under the hood)
		"-fflags", "+genpts",
		"-read_intervals", strings.Join(
			Map(
				make([]string, int(info.Duration/4)+1),
				func(_ string, idx int) string {
					return fmt.Sprintf("%v%%+#1", idx*4)
				},
			),
			",",
		),
		"-of", "csv=print_section=0",
		info.Path,
	)
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return err
	}
	err = cmd.Start()
	if err != nil {
		return err
	}
	// we don't care about the result but await it for traces.
	go cmd.Wait()

	scanner := bufio.NewScanner(stdout)

	ret := make([]float64, 0, 200)
	limit := 100
	done := 0
	notified := false

	for scanner.Scan() {
		pts := scanner.Text()
		if pts == "" || pts == "N/A" {
			continue
		}

		fpts, err := strconv.ParseFloat(pts, 64)
		if err != nil {
			return err
		}

		ret = append(ret, fpts)
		shouldNotify := !notified && fpts >= minParsedKeyframeTime && len(ret) >= minParsedKeyframeCount
		if len(ret) == limit || shouldNotify {
			kf.add(ret)
			if done == 0 {
				kf.info.ready.Done()
			} else if done >= 500 {
				limit = 500
			}
			done += limit
			// clear the array without reallocating it
			ret = ret[:0]

			notified = true
		}
	}
	kf.add(ret)
	kf.IsDone = true
	if done == 0 {
		kf.info.ready.Done()
	}
	return nil
}
