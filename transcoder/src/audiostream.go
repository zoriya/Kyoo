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

func (as *AudioStream) getIdentifier() string {
	return fmt.Sprintf("a%d", as.index)
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

func (ts *AudioStream) GetIndex() (string, error) {
	index := `#EXTM3U
#EXT-X-VERSION:7
#EXT-X-PLAYLIST-TYPE:EVENT
#EXT-X-START:TIME-OFFSET=0
#EXT-X-MEDIA-SEQUENCE:0
#EXT-X-INDEPENDENT-SEGMENTS
#EXT-X-MAP:URI="init.mp4"
`
	index += fmt.Sprintf("#EXT-X-TARGETDURATION:%d\n", int(OptimalFragmentDuration)+1)

	count := int32((float64(ts.file.Info.Duration) / OptimalFragmentDuration))
	for segment := int32(0); segment < count; segment++ {
		index += fmt.Sprintf("#EXTINF:%.6f\n", OptimalFragmentDuration)
		index += fmt.Sprintf("segment-%d.m4s\n", segment)
	}

	last_ts := float64(count) * OptimalFragmentDuration
	if last_ts > 0 {
		index += fmt.Sprintf("#EXTINF:%.6f\n", float64(ts.file.Info.Duration)-last_ts)
		index += fmt.Sprintf("segment-%d.m4s\n", count)
	}
	index += `#EXT-X-ENDLIST`
	return index, nil
}
