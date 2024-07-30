package src

import (
	"bufio"
	"database/sql/driver"
	"errors"
	"fmt"
	"log"
	"os/exec"
	"strconv"
	"strings"
	"sync"
)

const KeyframeVersion = 1

type Keyframe struct {
	Keyframes []float64
	IsDone    bool
	info      *KeyframeInfo
}
type KeyframeInfo struct {
	mutex     sync.RWMutex
	listeners []func(keyframes []float64)
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
	defer kf.info.mutex.Unlock()
	kf.Keyframes = append(kf.Keyframes, values...)
	for _, listener := range kf.info.listeners {
		listener(kf.Keyframes)
	}
}

func (kf *Keyframe) AddListener(callback func(keyframes []float64)) {
	kf.info.mutex.Lock()
	defer kf.info.mutex.Unlock()
	kf.info.listeners = append(kf.info.listeners, callback)
}

func (kf *Keyframe) Value() (driver.Value, error) {
	return driver.Value(kf.Keyframes), nil
}

func (kf *Keyframe) Scan(src interface{}) error {
	switch src.(type) {
	case []float64:
		kf.Keyframes = src.([]float64)
		kf.IsDone = true
		kf.info = &KeyframeInfo{}
	default:
		return errors.New("incompatible type for keyframe in database")
	}
	return nil
}

type KeyframeKey struct {
	Sha     string
	IsVideo bool
	Index   int
}

func (s *MetadataService) GetKeyframe(info *MediaInfo, isVideo bool, idx int) (*Keyframe, error) {
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

	var ready sync.WaitGroup
	var err error
	ready.Add(1)
	go func() {
		var table string
		if isVideo {
			table = "videos"
			err = getVideoKeyframes(info.Path, idx, kf, &ready)
		} else {
			table = "audios"
			err = getAudioKeyframes(info, idx, kf, &ready)
		}

		if err != nil {
			log.Printf("Couldn't retrive keyframes for %s %s %d: %v", info.Path, table, idx, err)
			return
		}

		_, err = s.database.NamedExec(
			fmt.Sprint(
				`update %s set keyframes = :keyframes, ver_keyframes = :version where sha = :sha and idx = :idx`,
				table,
			),
			map[string]interface{}{
				"sha":       info.Sha,
				"idx":       idx,
				"keyframes": kf.Keyframes,
				"version":   KeyframeVersion,
			},
		)
		if err != nil {
			log.Printf("Couldn't store keyframes on database: %v", err)
		}
	}()
	ready.Wait()
	return set(kf, err)
}

// Retrive video's keyframes and store them inside the kf var.
// Returns when all key frames are retrived (or an error occurs)
// ready.Done() is called when more than 100 are retrived (or extraction is done)
func getVideoKeyframes(path string, video_idx int, kf *Keyframe, ready *sync.WaitGroup) error {
	defer printExecTime("ffprobe keyframe analysis for %s video n%d", path, video_idx)()
	// run ffprobe to return all IFrames, IFrames are points where we can split the video in segments.
	// We ask ffprobe to return the time of each frame and it's flags
	// We could ask it to return only i-frames (keyframes) with the -skip_frame nokey but using it is extremly slow
	// since ffmpeg parses every frames when this flag is set.
	cmd := exec.Command(
		"ffprobe",
		"-loglevel", "error",
		"-select_streams", fmt.Sprint("V:%d", video_idx),
		"-show_entries", "packet=pts_time,flags",
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

	scanner := bufio.NewScanner(stdout)

	ret := make([]float64, 0, 1000)
	max := 100
	done := 0
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

		if len(ret) == max {
			kf.add(ret)
			if done == 0 {
				ready.Done()
			} else if done >= 500 {
				max = 500
			}
			done += max
			// clear the array without reallocing it
			ret = ret[:0]
		}
	}
	kf.add(ret)
	if done == 0 {
		ready.Done()
	}
	kf.IsDone = true
	return nil
}

func getAudioKeyframes(info *MediaInfo, audio_idx int, kf *Keyframe, ready *sync.WaitGroup) error {
	dummyKeyframeDuration := float64(4)
	segmentCount := int((float64(info.Duration) / dummyKeyframeDuration) + 1)
	kf.Keyframes = make([]float64, segmentCount)
	for segmentIndex := 0; segmentIndex < segmentCount; segmentIndex += 1 {
		kf.Keyframes[segmentIndex] = float64(segmentIndex) * dummyKeyframeDuration
	}

	ready.Done()
	kf.IsDone = true
	return nil
}
