package src

import (
	"fmt"
	"log"
)

type AudioStream struct {
	Stream
	index int32
}

func NewAudioStream(file *FileStream, idx int32) *AudioStream {
	log.Printf("Creating a audio stream %d for %s", idx, file.Path)
	ret := new(AudioStream)
	ret.index = idx
	ret.Stream = NewStream(file, ret)
	return ret
}

func (as *AudioStream) getOutPath() string {
	return fmt.Sprintf("%s/segment-a%d-%%03d.ts", as.file.Out, as.index)
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
