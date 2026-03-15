package src

import (
	"fmt"
	"log"
)

type AudioStream struct {
	Stream
	audio   *Audio
	quality AudioQuality
}

func (t *Transcoder) NewAudioStream(file *FileStream, idx uint32, quality AudioQuality) (*AudioStream, error) {
	log.Printf("Creating a audio stream %d for %s", idx, file.Info.Path)

	keyframes, err := t.metadataService.GetKeyframes(file.Info, false, idx)
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

	NewStream(file, keyframes, ret, &ret.Stream)
	return ret, nil
}

func (as *AudioStream) getOutPath(encoder_id int) string {
	return fmt.Sprintf("%s/segment-a%d-%s-%d-%%d.ts", as.file.Out, as.audio.Index, string(as.quality), encoder_id)
}

func (as *AudioStream) getFlags() Flags {
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
