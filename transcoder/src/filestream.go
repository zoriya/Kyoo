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
	audios     CMap[uint32, *AudioStream]
}

type VideoKey struct {
	idx     uint32
	quality Quality
}

func (t *Transcoder) newFileStream(path string, sha string) *FileStream {
	ret := &FileStream{
		transcoder: t,
		Out:        fmt.Sprintf("%s/%s", Settings.Outpath, sha),
		videos:     NewCMap[VideoKey, *VideoStream](),
		audios:     NewCMap[uint32, *AudioStream](),
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

	// TODO: support multiples audio qualities (and original)
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
		master += "CHANNELS=\"2\","
		master += fmt.Sprintf("URI=\"./audio/%d/index.m3u8\"\n", audio.Index)
	}

	// codec is the prefix + the level, the level is not part of the codec we want to compare for the same_codec check bellow
	transmux_prefix := "avc1.6400"
	transmux_codec := transmux_prefix + "28"
	audio_codec := "mp4a.40.2"

	var def_video *Video
	for _, video := range fs.Info.Videos {
		if video.IsDefault {
			def_video = &video
			break
		}
	}
	if def_video == nil && len(fs.Info.Videos) > 0 {
		def_video = &fs.Info.Videos[0]
	}

	if def_video != nil {
		qualities := Filter(Qualities, func(quality Quality) bool {
			same_codec := def_video.MimeCodec != nil && strings.HasPrefix(*def_video.MimeCodec, transmux_prefix)
			return quality.Height() < def_video.Quality().Height() ||
				(quality.Height() == def_video.Quality().Height() && !same_codec)
		})

		for _, quality := range qualities {
			for _, video := range fs.Info.Videos {
				master += "#EXT-X-MEDIA:TYPE=VIDEO,"
				master += fmt.Sprintf("GROUP-ID=\"%s\",", quality)
				if video.Language != nil {
					master += fmt.Sprintf("LANGUAGE=\"%s\",", *video.Language)
				}
				if video.Title != nil {
					master += fmt.Sprintf("NAME=\"%s\",", *video.Title)
				} else if video.Language != nil {
					master += fmt.Sprintf("NAME=\"%s\",", *video.Language)
				} else {
					master += fmt.Sprintf("NAME=\"Video %d\",", video.Index)
				}
				if &video == def_video {
					master += "DEFAULT=YES"
				} else {
					master += fmt.Sprintf("URI=\"./%d/%s/index.m3u8\"\n", video.Index, quality)
				}
			}
		}

		// original stream
		{
			bitrate := float64(def_video.Bitrate)
			master += "#EXT-X-STREAM-INF:"
			master += fmt.Sprintf("AVERAGE-BANDWIDTH=%d,", int(math.Min(bitrate*0.8, float64(def_video.Quality().AverageBitrate()))))
			master += fmt.Sprintf("BANDWIDTH=%d,", int(math.Min(bitrate, float64(def_video.Quality().MaxBitrate()))))
			master += fmt.Sprintf("RESOLUTION=%dx%d,", def_video.Width, def_video.Height)
			if def_video.MimeCodec != nil {
				master += fmt.Sprintf("CODECS=\"%s\",", strings.Join([]string{*def_video.MimeCodec, audio_codec}, ","))
			}
			master += "AUDIO=\"audio\","
			master += "CLOSED-CAPTIONS=NONE\n"
			master += fmt.Sprintf("./%d/%s/index.m3u8\n", def_video.Index, Original)
		}

		aspectRatio := float32(def_video.Width) / float32(def_video.Height)

		for i, quality := range qualities {
			if i == 0 {
				// skip the original stream that already got handled
				continue
			}

			master += "#EXT-X-STREAM-INF:"
			master += fmt.Sprintf("AVERAGE-BANDWIDTH=%d,", quality.AverageBitrate())
			master += fmt.Sprintf("BANDWIDTH=%d,", quality.MaxBitrate())
			master += fmt.Sprintf("RESOLUTION=%dx%d,", int(aspectRatio*float32(quality.Height())+0.5), quality.Height())
			master += fmt.Sprintf("CODECS=\"%s\",", strings.Join([]string{transmux_codec, audio_codec}, ","))
			master += "AUDIO=\"audio\","
			master += "CLOSED-CAPTIONS=NONE\n"
			master += fmt.Sprintf("./%s/index.m3u8\n", quality)
		}
	}

	return master
}

func (fs *FileStream) getVideoStream(idx uint32, quality Quality) (*VideoStream, error) {
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

func (fs *FileStream) GetVideoIndex(idx uint32, quality Quality) (string, error) {
	stream, err := fs.getVideoStream(idx, quality)
	if err != nil {
		return "", err
	}
	return stream.GetIndex()
}

func (fs *FileStream) GetVideoSegment(idx uint32, quality Quality, segment int32) (string, error) {
	stream, err := fs.getVideoStream(idx, quality)
	if err != nil {
		return "", err
	}
	return stream.GetSegment(segment)
}

func (fs *FileStream) getAudioStream(audio uint32) (*AudioStream, error) {
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

func (fs *FileStream) GetAudioIndex(audio uint32) (string, error) {
	stream, err := fs.getAudioStream(audio)
	if err != nil {
		return "", nil
	}
	return stream.GetIndex()
}

func (fs *FileStream) GetAudioSegment(audio uint32, segment int32) (string, error) {
	stream, err := fs.getAudioStream(audio)
	if err != nil {
		return "", nil
	}
	return stream.GetSegment(segment)
}
