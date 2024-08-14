package src

import (
	"fmt"
	"log"
)

type AudioStream struct {
	Stream
	index uint32
}

func (t *Transcoder) NewAudioStream(file *FileStream, idx uint32) (*AudioStream, error) {
	log.Printf("Creating a audio stream %d for %s", idx, file.Info.Path)

	keyframes, err := t.metadataService.GetKeyframes(file.Info, false, idx)
	if err != nil {
		return nil, err
	}

	ret := new(AudioStream)
	ret.index = idx
	NewStream(file, keyframes, ret, &ret.Stream)
	return ret, nil
}

func (as *AudioStream) getOutPath(encoder_id int) string {
	return fmt.Sprintf("%s/segment-a%d-%d-%%d.ts", as.file.Out, as.index, encoder_id)
}

func (as *AudioStream) getFlags() Flags {
	return AudioF
}

func (as *AudioStream) getTranscodeArgs(segments string) []string {
	return []string{
		"-map", fmt.Sprintf("0:a:%d", as.index),
		"-c:a", "aac",
		// TODO: Support 5.1 audio streams.
		"-ac", "2",
		// TODO: Support multi audio qualities.
		"-b:a", "128k",
	}
}
