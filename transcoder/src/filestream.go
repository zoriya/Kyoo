package src

import (
	"context"
	"fmt"
	"log/slog"
	"math"
	"os"
	"slices"
	"strings"
	"sync"

	"github.com/zoriya/kyoo/transcoder/src/utils"
)

type FileStream struct {
	transcoder *Transcoder
	ready      sync.WaitGroup
	err        error
	Out        string
	Info       *MediaInfo
	videos     CMap[VideoKey, *VideoStream]
	audios     CMap[AudioKey, *AudioStream]
}

type AudioKey struct {
	idx     uint32
	quality AudioQuality
}

type VideoKey struct {
	idx     uint32
	quality VideoQuality
}

func (t *Transcoder) newFileStream(ctx context.Context, path string, sha string) *FileStream {
	ret := &FileStream{
		transcoder: t,
		Out:        fmt.Sprintf("%s/%s", Settings.Outpath, sha),
		videos:     NewCMap[VideoKey, *VideoStream](),
		audios:     NewCMap[AudioKey, *AudioStream](),
	}

	ret.ready.Add(1)
	go func(ctx context.Context) {
		defer ret.ready.Done()
		ctx = context.WithoutCancel(ctx)
		defer func() {
			if r := recover(); r != nil {
				slog.ErrorContext(ctx, "recovered from panic while retrieving metadata",
					"path", path, "panic", fmt.Sprintf("%v", r))
				if ret.err == nil {
					ret.err = fmt.Errorf("panic while retrieving metadata: %v", r)
				}
			}
		}()
		info, err := t.metadataService.GetMetadata(ctx, path, sha)
		ret.Info = info
		if err != nil {
			ret.err = err
		}
	}(ctx)

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

func (fs *FileStream) Destroy(ctx context.Context) {
	ctx = context.WithoutCancel(ctx)
	slog.InfoContext(ctx, "removing all transcode cache files", "path", fs.Info.Path)
	fs.Kill()
	_ = os.RemoveAll(fs.Out)
}

func (fs *FileStream) GetMaster(ctx context.Context, client string) string {
	ctx = context.WithoutCancel(ctx)
	master := "#EXTM3U\n"

	// codec is the prefix + the level, the level is not part of the codec we want to compare for the same_codec check bellow
	transcode_prefix := "avc1.6400"
	transcode_codec := transcode_prefix + "28"
	transcode_audio_codec := "mp4a.40.2"

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

	var def_audio *Audio
	for _, audio := range fs.Info.Audios {
		if audio.IsDefault {
			def_audio = &audio
			break
		}
	}
	if def_audio == nil && len(fs.Info.Audios) > 0 {
		def_audio = &fs.Info.Audios[0]
	}

	if def_audio != nil {
		aqualities := utils.Filter(AudioQualities, func(quality AudioQuality) bool {
			return quality.Bitrate() < def_audio.Bitrate
		})
		aqualities = append(aqualities, AOriginal)

		for _, audio := range fs.Info.Audios {
			for _, quality := range slices.Backward(aqualities) {
				master += "#EXT-X-MEDIA:TYPE=AUDIO,"
				master += fmt.Sprintf("GROUP-ID=\"a-%s\",", quality)
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
				if audio == *def_audio {
					master += "DEFAULT=YES,"
				}
				if quality == AOriginal {
					master += fmt.Sprintf("CHANNELS=\"%d\",", audio.Channels)
				} else {
					master += "CHANNELS=\"2\","
				}
				master += fmt.Sprintf("URI=\"audio/%d/%s/index.m3u8?clientId=%s\"\n", audio.Index, quality, client)
			}
			master += "\n"
		}
		master += "\n"
	}

	if def_video != nil {
		qualities := utils.Filter(VideoQualities, func(quality VideoQuality) bool {
			return quality.Height() < def_video.Height
		})

		// NoResize is the same idea as Original but we change the codec.
		// This is only needed when the original's codec is different from what we would transcode it to.
		if def_video.MimeCodec == nil || !strings.HasPrefix(*def_video.MimeCodec, transcode_prefix) {
			qualities = append(qualities, NoResize)
		}
		qualities = append(qualities, Original)

		for _, video := range fs.Info.Videos {
			for _, quality := range slices.Backward(qualities) {
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
				if video == *def_video {
					master += "DEFAULT=YES\n"
				} else {
					master += fmt.Sprintf("URI=\"%d/%s/index.m3u8?clientId=%s\"\n", video.Index, quality, client)
				}
			}
			master += "\n"
		}
		master += "\n"

		aspectRatio := float32(def_video.Width) / float32(def_video.Height)
		for _, quality := range slices.Backward(qualities) {
			if quality == Original || quality == NoResize {
				audios := []AudioQuality{AOriginal}
				if def_audio != nil && (def_audio.MimeCodec == nil || *def_audio.MimeCodec != transcode_audio_codec) {
					audios = append(audios, matchAudioQuality(def_video.Quality()))
				}
				for _, aquality := range audios {
					// original & noresize streams
					bitrate := float64(def_video.Bitrate)
					master += "#EXT-X-STREAM-INF:"
					master += fmt.Sprintf("AVERAGE-BANDWIDTH=%d,", int(math.Min(bitrate*0.8, float64(def_video.Quality().AverageBitrate()))))
					master += fmt.Sprintf("BANDWIDTH=%d,", int(math.Min(bitrate, float64(def_video.Quality().MaxBitrate()))))
					master += fmt.Sprintf("RESOLUTION=%dx%d,", def_video.Width, def_video.Height)

					codecs := make([]string, 0)
					if quality == Original {
						if def_video.MimeCodec != nil {
							codecs = append(codecs, *def_video.MimeCodec)
						}
					} else {
						codecs = append(codecs, transcode_codec)
					}
					if aquality == AOriginal {
						if def_audio != nil && def_audio.MimeCodec != nil {
							codecs = append(codecs, *def_audio.MimeCodec)
						}
					} else {
						codecs = append(codecs, transcode_audio_codec)
					}
					if len(codecs) > 0 {
						master += fmt.Sprintf("CODECS=\"%s\",", strings.Join(codecs, ","))
					}
					if def_audio != nil {
						master += fmt.Sprintf("AUDIO=\"a-%s\",", string(aquality))
					}
					master += "CLOSED-CAPTIONS=NONE\n"
					master += fmt.Sprintf("%d/%s/index.m3u8?clientId=%s\n", def_video.Index, quality, client)
				}
				continue
			}

			master += "#EXT-X-STREAM-INF:"
			master += fmt.Sprintf("AVERAGE-BANDWIDTH=%d,", quality.AverageBitrate())
			master += fmt.Sprintf("BANDWIDTH=%d,", quality.MaxBitrate())
			master += fmt.Sprintf("RESOLUTION=%dx%d,", int(aspectRatio*float32(quality.Height())+0.5), quality.Height())
			master += fmt.Sprintf("CODECS=\"%s\",", strings.Join([]string{transcode_codec, transcode_audio_codec}, ","))
			if def_audio != nil {
				master += fmt.Sprintf("AUDIO=\"a-%s\",", string(matchAudioQuality(quality)))
			}
			master += "CLOSED-CAPTIONS=NONE\n"
			master += fmt.Sprintf("%d/%s/index.m3u8?clientId=%s\n", def_video.Index, quality, client)
		}
	}

	return master
}

func (fs *FileStream) getVideoStream(ctx context.Context, idx uint32, quality VideoQuality) (*VideoStream, error) {
	ctx = context.WithoutCancel(ctx)
	var createErr error
	key := VideoKey{idx, quality}
	stream, _ := fs.videos.GetOrCreate(key, func() *VideoStream {
		ret, err := fs.transcoder.NewVideoStream(ctx, fs, idx, quality)
		if err != nil {
			createErr = err
			return nil
		}
		return ret
	})
	if stream == nil {
		fs.videos.Remove(key)
		if createErr == nil {
			createErr = fmt.Errorf("could not create video stream %d/%s", idx, quality)
		}
		return nil, createErr
	}
	stream.ready.Wait()
	return stream, nil
}

func (fs *FileStream) GetVideoIndex(ctx context.Context, idx uint32, quality VideoQuality, client string) (string, error) {
	ctx = context.WithoutCancel(ctx)
	stream, err := fs.getVideoStream(ctx, idx, quality)
	if err != nil {
		return "", err
	}
	return stream.GetIndex(ctx, client)
}

func (fs *FileStream) GetVideoSegment(ctx context.Context, idx uint32, quality VideoQuality, segment int32) (string, error) {
	ctx = context.WithoutCancel(ctx)
	stream, err := fs.getVideoStream(ctx, idx, quality)
	if err != nil {
		return "", err
	}
	return stream.GetSegment(ctx, segment)
}

func (fs *FileStream) GetVideoInit(ctx context.Context, idx uint32, quality VideoQuality) (string, error) {
	ctx = context.WithoutCancel(ctx)
	stream, err := fs.getVideoStream(ctx, idx, quality)
	if err != nil {
		return "", err
	}
	return stream.GetInit(ctx)
}

func (fs *FileStream) getAudioStream(ctx context.Context, idx uint32, quality AudioQuality) (*AudioStream, error) {
	ctx = context.WithoutCancel(ctx)
	var createErr error
	key := AudioKey{idx, quality}
	stream, _ := fs.audios.GetOrCreate(key, func() *AudioStream {
		ret, err := fs.transcoder.NewAudioStream(ctx, fs, idx, quality)
		if err != nil {
			createErr = err
			return nil
		}
		return ret
	})
	if stream == nil {
		fs.audios.Remove(key)
		if createErr == nil {
			createErr = fmt.Errorf("could not create audio stream %d/%s", idx, quality)
		}
		return nil, createErr
	}
	stream.ready.Wait()
	return stream, nil
}

func (fs *FileStream) GetAudioIndex(ctx context.Context, idx uint32, quality AudioQuality, client string) (string, error) {
	ctx = context.WithoutCancel(ctx)
	stream, err := fs.getAudioStream(ctx, idx, quality)
	if err != nil {
		return "", err
	}
	return stream.GetIndex(ctx, client)
}

func (fs *FileStream) GetAudioSegment(ctx context.Context, idx uint32, quality AudioQuality, segment int32) (string, error) {
	ctx = context.WithoutCancel(ctx)
	stream, err := fs.getAudioStream(ctx, idx, quality)
	if err != nil {
		return "", err
	}
	return stream.GetSegment(ctx, segment)
}

func (fs *FileStream) GetAudioInit(ctx context.Context, idx uint32, quality AudioQuality) (string, error) {
	ctx = context.WithoutCancel(ctx)
	stream, err := fs.getAudioStream(ctx, idx, quality)
	if err != nil {
		return "", err
	}
	return stream.GetInit(ctx)
}

func matchAudioQuality(q VideoQuality) AudioQuality {
	switch q {
	case P240:
		return K128
	case P360:
		return K128
	case P480:
		return K128
	case P720:
		return K192
	case P1080:
		return K192
	case P1440:
		return K256
	case P4k:
		return K512
	case P8k:
		return K512
	default:
		return AOriginal
	}
}
