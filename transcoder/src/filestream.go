package src

import (
	"bufio"
	"fmt"
	"math"
	"os"
	"os/exec"
	"strconv"
	"strings"
	"sync"
)

type FileStream struct {
	ready       sync.WaitGroup
	err         error
	Path        string
	Out         string
	Keyframes   []float64
	CanTransmux bool
	Info        *MediaInfo
	videos      CMap[Quality, *VideoStream]
	audios      CMap[int32, *AudioStream]
}

func NewFileStream(path string, sha string, route string) *FileStream {
	ret := &FileStream{
		Path:   path,
		Out:    fmt.Sprintf("%s/%s", Settings.Outpath, sha),
		videos: NewCMap[Quality, *VideoStream](),
		audios: NewCMap[int32, *AudioStream](),
	}

	ret.ready.Add(1)
	go func() {
		defer ret.ready.Done()
		info, err := GetInfo(path, sha, route)
		ret.Info = info
		if err != nil {
			ret.err = err
		}
	}()

	ret.ready.Add(1)
	go func() {
		defer ret.ready.Done()
		keyframes, can_transmux, err := GetKeyframes(path)
		ret.Keyframes = keyframes
		ret.CanTransmux = can_transmux
		if err != nil {
			ret.err = err
		}
	}()

	return ret
}

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
	last := 0.
	can_transmux := true
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

func (fs *FileStream) Kill() {
	fs.videos.lock.Lock()
	defer fs.videos.lock.Unlock()
	fs.audios.lock.Lock()
	defer fs.audios.lock.Unlock()

	for _, s := range fs.videos.data {
		s.Kill()
	}
	for _, s := range fs.audios.data {
		s.Kill()
	}
}

func (fs *FileStream) Destroy() {
	fs.Kill()
	_ = os.RemoveAll(fs.Out)
}

func (fs *FileStream) GetMaster() string {
	master := "#EXTM3U\n"
	if fs.Info.Video != nil {
		var transmux_quality Quality
		for _, quality := range Qualities {
			if quality.Height() >= fs.Info.Video.Quality.Height() || quality.AverageBitrate() >= fs.Info.Video.Bitrate {
				transmux_quality = quality
				break
			}
		}
		// TODO: also check if the codec is valid in a hls before putting transmux
		if fs.CanTransmux {
			bitrate := float64(fs.Info.Video.Bitrate)
			master += "#EXT-X-STREAM-INF:"
			master += fmt.Sprintf("AVERAGE-BANDWIDTH=%d,", int(math.Min(bitrate*0.8, float64(transmux_quality.AverageBitrate()))))
			master += fmt.Sprintf("BANDWIDTH=%d,", int(math.Min(bitrate, float64(transmux_quality.MaxBitrate()))))
			master += fmt.Sprintf("RESOLUTION=%dx%d,", fs.Info.Video.Width, fs.Info.Video.Height)
			master += "AUDIO=\"audio\","
			master += "CLOSED-CAPTIONS=NONE\n"
			master += fmt.Sprintf("./%s/index.m3u8\n", Original)
		}
		aspectRatio := float32(fs.Info.Video.Width) / float32(fs.Info.Video.Height)
		for _, quality := range Qualities {
			if quality.Height() < fs.Info.Video.Quality.Height() && quality.AverageBitrate() < fs.Info.Video.Bitrate {
				master += "#EXT-X-STREAM-INF:"
				master += fmt.Sprintf("AVERAGE-BANDWIDTH=%d,", quality.AverageBitrate())
				master += fmt.Sprintf("BANDWIDTH=%d,", quality.MaxBitrate())
				master += fmt.Sprintf("RESOLUTION=%dx%d,", int(aspectRatio*float32(quality.Height())+0.5), quality.Height())
				master += "CODECS=\"avc1.640028\","
				master += "AUDIO=\"audio\","
				master += "CLOSED-CAPTIONS=NONE\n"
				master += fmt.Sprintf("./%s/index.m3u8\n", quality)
			}
		}
	}
	for _, audio := range fs.Info.Audios {
		master += "#EXT-X-MEDIA:TYPE=AUDIO,"
		master += "GROUP-ID=\"audio\","
		if audio.Language != nil {
			master += fmt.Sprintf("LANGUAGE=\"%s\",", *audio.Language)
		}
		if audio.Title != nil {
			master += fmt.Sprintf("NAME=\"%s\",", *audio.Title)
		} else if audio.Language != nil {
			master += fmt.Sprintf("NAME=\"%s\",", *audio.Language)
		} else {
			master += fmt.Sprintf("NAME=\"Audio %d\",", audio.Index)
		}
		if audio.IsDefault {
			master += "DEFAULT=YES,"
		}
		master += fmt.Sprintf("URI=\"./audio/%d/index.m3u8\"\n", audio.Index)
	}
	return master
}

func (fs *FileStream) getVideoStream(quality Quality) *VideoStream {
	stream, _ := fs.videos.GetOrCreate(quality, func() *VideoStream {
		return NewVideoStream(fs, quality)
	})
	return stream
}

func (fs *FileStream) GetVideoIndex(quality Quality) (string, error) {
	stream := fs.getVideoStream(quality)
	return stream.GetIndex()
}

func (fs *FileStream) GetVideoSegment(quality Quality, segment int32) (string, error) {
	stream := fs.getVideoStream(quality)
	return stream.GetSegment(segment)
}

func (fs *FileStream) getAudioStream(audio int32) *AudioStream {
	stream, _ := fs.audios.GetOrCreate(audio, func() *AudioStream {
		return NewAudioStream(fs, audio)
	})
	return stream
}

func (fs *FileStream) GetAudioIndex(audio int32) (string, error) {
	stream := fs.getAudioStream(audio)
	return stream.GetIndex()
}

func (fs *FileStream) GetAudioSegment(audio int32, segment int32) (string, error) {
	stream := fs.getAudioStream(audio)
	return stream.GetSegment(segment)
}
