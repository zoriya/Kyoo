package src

import (
	"fmt"
	"math"
	"os/exec"
	"strconv"
	"strings"
)

type FileStream struct {
	Path        string
	Keyframes   []float64
	CanTransmux bool
	Info        *MediaInfo
	streams     map[Quality]TranscodeStream
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
		Keyframes:   keyframes,
		CanTransmux: can_transmux,
		Info:        info.info,
		streams:     make(map[Quality]TranscodeStream),
	}, nil
}

func GetKeyframes(path string) ([]float64, bool, error) {
	// run ffprobe to return all IFrames, IFrames are points where we can split the video in segments.
	out, err := exec.Command(
		"ffprobe",
		"-loglevel", "error",
		"-select_streams", "v:0",
		"-show_entries", "packet=pts_time,flags",
		"-of", "csv=print_section=0",
		path,
	).Output()
	// We ask ffprobe to return the time of each frame and it's flags
	// We could ask it to return only i-frames (keyframes) with the -skip_frame nokey but using it is extremly slow
	// since ffmpeg parses every frames when this flag is set.
	if err != nil {
		return nil, false, err
	}

	ret := make([]float64, 0, 300)
	last := 0.
	can_transmux := true
	for _, frame := range strings.Split(string(out), "\n") {
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

		// Only save keyframes with at least 3s betweens, we dont want a segment of 0.2s
		if fpts-last < 3 {
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

func (fs *FileStream) IsDead() bool {
	for _, s := range fs.streams {
		if len(s.Clients) > 0 {
			return false
		}
	}
	// TODO: Also check how long this stream has been unused. We dont want to kill streams created 2min ago
	return true
}

func (fs *FileStream) Destroy() {
	// TODO: kill child process and delete data
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
		master += "DEFAULT=YES,"
		master += fmt.Sprintf("URI=\"./audio/%d/index.m3u8\"\n", audio.Index)
	}
	return master
}
