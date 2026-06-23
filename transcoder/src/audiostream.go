package src

import (
	"context"
	"fmt"
	"log/slog"
)

type AudioStream struct {
	Stream
	audio   *Audio
	quality AudioQuality
}

func (t *Transcoder) NewAudioStream(ctx context.Context, file *FileStream, idx uint32, quality AudioQuality) (*AudioStream, error) {
	ctx = context.WithoutCancel(ctx)
	slog.InfoContext(ctx, "creating an audio stream", "idx", idx, "path", file.Info.Path)

	keyframes, err := t.metadataService.GetKeyframes(ctx, file.Info, false, idx)
	if err != nil {
		return nil, err
	}

	ret := new(AudioStream)
	ret.quality = quality
	for _, audio := range file.Info.Audios {
		if audio.Index == idx {
			ret.audio = &audio
			break
		}
	}
	if ret.audio == nil {
		return nil, fmt.Errorf("no audio track with index %d", idx)
	}

	NewStream(ctx, file, keyframes, ret, &ret.Stream)
	return ret, nil
}

func (as *AudioStream) getOutPath(encoder_id int) string {
	return fmt.Sprintf("%s/segment-a%d-%s-%d-%%d.mp4", as.file.Out, as.audio.Index, string(as.quality), encoder_id)
}

func (as *AudioStream) getInitPath() string {
	return fmt.Sprintf("%s/init-a%d-%s.mp4", as.file.Out, as.audio.Index, string(as.quality))
}

func (as *AudioStream) getFlags() Flags {
	if as.quality == AOriginal {
		return AudioF | CopyF
	}
	return AudioF
}

func (as *AudioStream) getTranscodeArgs(segments string) []string {
	args := []string{
		"-map", fmt.Sprintf("0:a:%d", as.audio.Index),
	}
	if as.quality == AOriginal {
		args = append(args, "-c:a", "copy")
	} else {
		args = append(args,
			// TODO: Support 5.1 audio streams.
			"-ac", "2",
			"-b:a", fmt.Sprint(as.quality.Bitrate()),
			"-c:a", "aac",
		)
	}
	return args
}
