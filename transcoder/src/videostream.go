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

func (vs *VideoStream) getFlags() Flags {
	return VideoF
}

func (vs *VideoStream) getOutPath(encoder_id int) string {
	return fmt.Sprintf("%s/segment-%s-%d-%%d.ts", vs.file.Out, vs.quality, encoder_id)
}

func (vs *VideoStream) getTranscodeArgs(segments string) []string {
	if vs.quality == Original {
		return []string{"-map", "0:V:0", "-c:v", "copy"}
	}

	return []string{
		// superfast or ultrafast would produce a file extremly big so we prever veryfast or faster.
		"-map", "0:V:0", "-c:v", "libx264", "-crf", "21", "-preset", "faster",
		// resize but keep aspect ratio (also force a width that is a multiple of two else some apps behave badly.
		"-vf", fmt.Sprintf("scale=-2:'min(%d,ih)'", vs.quality.Height()),
		// Even less sure but bufsize are 5x the avergae bitrate since the average bitrate is only
		// useful for hls segments.
		"-bufsize", fmt.Sprint(vs.quality.MaxBitrate() * 5),
		"-b:v", fmt.Sprint(vs.quality.AverageBitrate()),
		"-maxrate", fmt.Sprint(vs.quality.MaxBitrate()),
		// Force segments to be split exactly on keyframes (only works when transcoding)
		"-force_key_frames", segments,
		// sc_threshold is a scene detection mechanisum used to create a keyframe when the scene changes
		// this is on by default and inserts keyframes where we don't want to (it also breaks force_key_frames)
		// we disable it to prevents whole scenes from behing removed due to the -f segment failing to find the corresonding keyframe
		"-sc_threshold", "0",
		"-strict", "-2",
	}
}
