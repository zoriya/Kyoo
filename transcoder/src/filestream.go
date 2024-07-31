package src

import (
	"fmt"
	"log"
	"math"
	"os"
	"strings"
	"sync"
)

type FileStream struct {
	transcoder *Transcoder
	ready      sync.WaitGroup
	err        error
	Out        string
	Info       *MediaInfo
	videos     CMap[VideoKey, *VideoStream]
	audios     CMap[int32, *AudioStream]
}

type VideoKey struct {
	idx     int32
	quality Quality
}

func (t *Transcoder) newFileStream(path string, sha string) *FileStream {
	ret := &FileStream{
		transcoder: t,
		Out:        fmt.Sprintf("%s/%s", Settings.Outpath, sha),
		videos:     NewCMap[VideoKey, *VideoStream](),
		audios:     NewCMap[int32, *AudioStream](),
	}

	ret.ready.Add(1)
	go func() {
		defer ret.ready.Done()
		info, err := t.metadataService.GetMetadata(path, sha)
		ret.Info = info
		if err != nil {
			ret.err = err
		}
	}()

	return ret
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
	log.Printf("Removing all transcode cache files for %s", fs.Info.Path)
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
		// original stream
		{
			bitrate := float64(fs.Info.Video.Bitrate)
			master += "#EXT-X-STREAM-INF:"
			master += fmt.Sprintf("AVERAGE-BANDWIDTH=%d,", int(math.Min(bitrate*0.8, float64(transmux_quality.AverageBitrate()))))
			master += fmt.Sprintf("BANDWIDTH=%d,", int(math.Min(bitrate, float64(transmux_quality.MaxBitrate()))))
			master += fmt.Sprintf("RESOLUTION=%dx%d,", fs.Info.Video.Width, fs.Info.Video.Height)
			if fs.Info.Video.MimeCodec != nil {
				master += fmt.Sprintf("CODECS=\"%s\",", *fs.Info.Video.MimeCodec)
			}
			master += "AUDIO=\"audio\","
			master += "CLOSED-CAPTIONS=NONE\n"
			master += fmt.Sprintf("./%s/index.m3u8\n", Original)
		}

		aspectRatio := float32(fs.Info.Video.Width) / float32(fs.Info.Video.Height)
		// codec is the prefix + the level, the level is not part of the codec we want to compare for the same_codec check bellow
		transmux_prefix := "avc1.6400"
		transmux_codec := transmux_prefix + "28"

		for _, quality := range Qualities {
			same_codec := fs.Info.Video.MimeCodec != nil && strings.HasPrefix(*fs.Info.Video.MimeCodec, transmux_prefix)
			inc_lvl := quality.Height() < fs.Info.Video.Quality.Height() ||
				(quality.Height() == fs.Info.Video.Quality.Height() && !same_codec)

			if inc_lvl {
				master += "#EXT-X-STREAM-INF:"
				master += fmt.Sprintf("AVERAGE-BANDWIDTH=%d,", quality.AverageBitrate())
				master += fmt.Sprintf("BANDWIDTH=%d,", quality.MaxBitrate())
				master += fmt.Sprintf("RESOLUTION=%dx%d,", int(aspectRatio*float32(quality.Height())+0.5), quality.Height())
				master += fmt.Sprintf("CODECS=\"%s\",", transmux_codec)
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

func (fs *FileStream) getVideoStream(idx int32, quality Quality) (*VideoStream, error) {
	var err error
	stream, _ := fs.videos.GetOrCreate(VideoKey{idx, quality}, func() *VideoStream {
		var ret *VideoStream
		ret, err = fs.transcoder.NewVideoStream(fs, idx, quality)
		return ret
	})
	if err != nil {
		fs.videos.Remove(VideoKey{idx, quality})
		return nil, err
	}
	stream.ready.Wait()
	return stream, nil
}

func (fs *FileStream) GetVideoIndex(idx int32, quality Quality) (string, error) {
	stream, err := fs.getVideoStream(idx, quality)
	if err != nil {
		return "", err
	}
	return stream.GetIndex()
}

func (fs *FileStream) GetVideoSegment(idx int32, quality Quality, segment int32) (string, error) {
	stream, err := fs.getVideoStream(idx, quality)
	if err != nil {
		return "", err
	}
	return stream.GetSegment(segment)
}

func (fs *FileStream) getAudioStream(audio int32) (*AudioStream, error) {
	var err error
	stream, _ := fs.audios.GetOrCreate(audio, func() *AudioStream {
		var ret *AudioStream
		ret, err = fs.transcoder.NewAudioStream(fs, audio)
		return ret
	})
	if err != nil {
		fs.audios.Remove(audio)
		return nil, err
	}
	stream.ready.Wait()
	return stream, nil
}

func (fs *FileStream) GetAudioIndex(audio int32) (string, error) {
	stream, err := fs.getAudioStream(audio)
	if err != nil {
		return "", nil
	}
	return stream.GetIndex()
}

func (fs *FileStream) GetAudioSegment(audio int32, segment int32) (string, error) {
	stream, err := fs.getAudioStream(audio)
	if err != nil {
		return "", nil
	}
	return stream.GetSegment(segment)
}
