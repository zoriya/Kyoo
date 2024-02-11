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
	Path        string
	Out         string
	Keyframes   []float64
	CanTransmux bool
	Info        *MediaInfo
	streams     map[Quality]*VideoStream
	vlock       sync.Mutex
	audios      map[int32]*AudioStream
	alock       sync.Mutex
}

func NewFileStream(path string) (*FileStream, error) {
	info_chan := make(chan struct {
		info *MediaInfo
		err  error
	})
	go func() {
		ret, err := GetInfo(path)
		info_chan <- struct {
			info *MediaInfo
			err  error
		}{ret, err}
	}()

	keyframes, can_transmux, err := GetKeyframes(path)
	if err != nil {
		return nil, err
	}
	info := <-info_chan
	if info.err != nil {
		return nil, err
	}

	return &FileStream{
		Path:        path,
		Out:         fmt.Sprintf("%s/%s", Settings.Outpath, info.info.Sha),
		Keyframes:   keyframes,
		CanTransmux: can_transmux,
		Info:        info.info,
		streams:     make(map[Quality]*VideoStream),
		audios:      make(map[int32]*AudioStream),
	}, nil
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

	ret := make([]float64, 1, 300)
	ret[0] = 0
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
		// if fpts-last < 3 {
		if fpts == 0 {
			// we still ignore a keyframe in 0 because we hard code it above
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

func (fs *FileStream) Destroy() {
	fs.vlock.Lock()
	defer fs.vlock.Unlock()
	fs.alock.Lock()
	defer fs.alock.Unlock()

	for _, s := range fs.streams {
		s.Kill()
	}
	for _, s := range fs.audios {
		s.Kill()
	}
	_ = os.RemoveAll(fs.Out)
}

func (fs *FileStream) GetMaster() string {
	master := "#EXTM3U\n"
	// TODO: also check if the codec is valid in a hls before putting transmux
	if fs.CanTransmux {
		master += "#EXT-X-STREAM-INF:"
		master += fmt.Sprintf("AVERAGE-BANDWIDTH=%d,", fs.Info.Video.Bitrate)
		master += fmt.Sprintf("BANDWIDTH=%d,", int(float32(fs.Info.Video.Bitrate)*1.2))
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
	fs.vlock.Lock()
	defer fs.vlock.Unlock()
	stream, ok := fs.streams[quality]

	if ok {
		return stream
	}
	fs.streams[quality] = NewVideoStream(fs, quality)
	return fs.streams[quality]
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
	fs.alock.Lock()
	defer fs.alock.Unlock()
	stream, ok := fs.audios[audio]

	if ok {
		return stream
	}
	fs.audios[audio] = NewAudioStream(fs, audio)
	return fs.audios[audio]
}

func (fs *FileStream) GetAudioIndex(audio int32) (string, error) {
	stream := fs.getAudioStream(audio)
	return stream.GetIndex()
}

func (fs *FileStream) GetAudioSegment(audio int32, segment int32) (string, error) {
	stream := fs.getAudioStream(audio)
	return stream.GetSegment(segment)
}
