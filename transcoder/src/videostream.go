package src

import (
	"fmt"
	"log"
)

type VideoStream struct {
	Stream
	quality Quality
}

func NewVideoStream(file *FileStream, quality Quality) *VideoStream {
	log.Printf("Creating a new video stream for %s in quality %s", file.Path, quality)
	ret := new(VideoStream)
	ret.quality = quality
	ret.Stream = NewStream(file, ret)
	return ret
}

func (vs *VideoStream) getOutPath() string {
	return fmt.Sprintf("%s/segment-%s-%%03d.ts", vs.file.Out, vs.quality)
}

func (vs *VideoStream) getTranscodeArgs(segments string) []string {
	return vs.quality.getTranscodeArgs(&segments)
}

func (quality Quality) getTranscodeArgs(segments *string) []string {
	if quality == Original {
		return []string{"-map", "0:V:0", "-c:v", "copy"}
	}

	ret := []string{
		// superfast or ultrafast would produce a file extremly big so we prever veryfast or faster.
		"-map", "0:V:0", "-c:v", "libx264", "-crf", "21", "-preset", "faster",
		// resize but keep aspect ratio (also force a width that is a multiple of two else some apps behave badly.
		"-vf", fmt.Sprintf("scale=-2:'min(%d,ih)'", quality.Height()),
		// Even less sure but bufsize are 5x the avergae bitrate since the average bitrate is only
		// useful for hls segments.
		"-bufsize", fmt.Sprint(quality.MaxBitrate() * 5),
		"-b:v", fmt.Sprint(quality.AverageBitrate()),
		"-maxrate", fmt.Sprint(quality.MaxBitrate()),
		"-strict", "-2",
	}
	if segments != nil {
		ret = append(ret,
			// Force segments to be split exactly on keyframes (only works when transcoding)
			"-force_key_frames", *segments,
		)
	}

	return ret
}
