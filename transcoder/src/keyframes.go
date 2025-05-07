package src

import (
	"bufio"
	"errors"
	"fmt"
	"log"
	"os/exec"
	"strconv"
	"strings"
	"sync"

	"github.com/lib/pq"
	"github.com/zoriya/kyoo/transcoder/src/utils"
)

const (
	KeyframeVersion        = 1
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

func (kf *Keyframe) Scan(src interface{}) error {
	var arr pq.Float64Array
	err := arr.Scan(src)
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

func (s *MetadataService) GetKeyframes(info *MediaInfo, isVideo bool, idx uint32) (*Keyframe, error) {
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

	go func() {
		var table string
		var err error
		if isVideo {
			table = "videos"
			err = getVideoKeyframes(info.Path, idx, kf)
		} else {
			table = "audios"
			err = getAudioKeyframes(info, idx, kf)
		}

		if err != nil {
			log.Printf("Couldn't retrieve keyframes for %s %s %d: %v", info.Path, table, idx, err)
			return
		}

		kf.info.ready.Wait()
		tx, _ := s.database.Begin()
		tx.Exec(
			fmt.Sprintf(`update %s set keyframes = $3 where sha = $1 and idx = $2`, table),
			info.Sha,
			idx,
			pq.Array(kf.Keyframes),
		)
		tx.Exec(`update info set ver_keyframes = $2 where sha = $1`, info.Sha, KeyframeVersion)
		err = tx.Commit()
		if err != nil {
			log.Printf("Couldn't store keyframes on database: %v", err)
		}
	}()
	return set(kf, nil)
}

// Retrive video's keyframes and store them inside the kf var.
// Returns when all key frames are retrived (or an error occurs)
// info.ready.Done() is called when more than 100 are retrived (or extraction is done)
func getVideoKeyframes(path string, video_idx uint32, kf *Keyframe) error {
	defer utils.PrintExecTime("ffprobe keyframe analysis for %s video n%d", path, video_idx)()
	// run ffprobe to return all IFrames, IFrames are points where we can split the video in segments.
	// We ask ffprobe to return the time of each frame and it's flags
	// We could ask it to return only i-frames (keyframes) with the -skip_frame nokey but using it is extremly slow
	// since ffmpeg parses every frames when this flag is set.
	cmd := exec.Command(
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

	scanner := bufio.NewScanner(stdout)

	ret := make([]float64, 0, 1000)
	limit := 100
	done := 0
	indexNotificationComplete := false

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

		shouldNotifyIndexers := !indexNotificationComplete && fpts >= minParsedKeyframeTime && len(ret) >= minParsedKeyframeCount
		if len(ret) == limit || shouldNotifyIndexers {
			kf.add(ret)
			if done == 0 {
				kf.info.ready.Done()
			} else if done >= 500 {
				limit = 500
			}
			done += limit
			// clear the array without reallocing it
			ret = ret[:0]

			if shouldNotifyIndexers {
				indexNotificationComplete = true
			}
		}
	}
	kf.add(ret)
	kf.IsDone = true
	if done == 0 {
		kf.info.ready.Done()
	}
	return nil
}

const DummyKeyframeDuration = float64(4)

// we can pretty much cut audio at any point so no need to get specific frames, just cut every 4s
func getAudioKeyframes(info *MediaInfo, audio_idx uint32, kf *Keyframe) error {
	defer utils.PrintExecTime("ffprobe keyframe analysis for %s audio n%d", info.Path, audio_idx)()
	// Format's duration CAN be different than audio's duration. To make sure we do not
	// miss a segment or make one more, we need to check the audio's duration.
	//
	// Since fetching the duration requires reading packets and is SLOW, we start by generating
	// keyframes until a reasonably safe point of the file (if the format has a 20min duration, audio
	// probably has a close duration).
	// You can read why duration retrieval is slow on the comment below.
	safe_duration := info.Duration - 20
	segment_count := int((safe_duration / DummyKeyframeDuration) + 1)
	if segment_count > 0 {
		kf.Keyframes = make([]float64, segment_count)
		for i := 0; i < segment_count; i += 1 {
			kf.Keyframes[i] = float64(i) * DummyKeyframeDuration
		}
		kf.info.ready.Done()
	} else {
		segment_count = 0
	}

	// Some formats DO NOT contain a duration metadata, we need to manually fetch it
	// from the packets.
	//
	// We could use the same command to retrieve all packets and know when we can cut PRECISELY
	// but since packets always contain only a few ms we don't need this precision.
	cmd := exec.Command(
		"ffprobe",
		"-select_streams", fmt.Sprintf("a:%d", audio_idx),
		"-show_entries", "packet=pts_time",
		// some avi files don't have pts, we use this to ask ffmpeg to generate them (it uses the dts under the hood)
		"-fflags", "+genpts",
		// We use a read_interval LARGER than the file (at least we estimate)
		// This allows us to only decode the LAST packets
		"-read_intervals", fmt.Sprintf("%f", info.Duration+10_000),
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

	scanner := bufio.NewScanner(stdout)
	var duration float64
	for scanner.Scan() {
		pts := scanner.Text()
		if pts == "" || pts == "N/A" {
			continue
		}

		duration, err = strconv.ParseFloat(pts, 64)
		if err != nil {
			return err
		}

	}
	if err := scanner.Err(); err != nil {
		return err
	}
	if duration <= 0 {
		return errors.New("could not find audio's duration")
	}

	new_seg_count := int((duration / DummyKeyframeDuration) + 1)
	if new_seg_count > segment_count {
		new_segments := make([]float64, new_seg_count-segment_count)
		for i := segment_count; i < new_seg_count; i += 1 {
			new_segments[i-segment_count] = float64(i) * DummyKeyframeDuration
		}
		kf.add(new_segments)
		if segment_count == 0 {
			kf.info.ready.Done()
		}
	}

	kf.IsDone = true
	return nil
}
