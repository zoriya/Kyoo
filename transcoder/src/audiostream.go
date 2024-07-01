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
	NewStream(file, ret, &ret.Stream)
	return ret
}

func (as *AudioStream) getSegmentName() string {
	return fmt.Sprintf("segment-a-%d-%%d.m4s", as.index)
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
