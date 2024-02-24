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
	if vs.quality == Original {
		return VideoF & Transmux
	}
	return VideoF
}

func (vs *VideoStream) getOutPath(encoder_id int) string {
	return fmt.Sprintf("%s/segment-%s-%d-%%d.ts", vs.file.Out, vs.quality, encoder_id)
}

func closestMultiple(n int32, x int32) int32 {
	if x > n {
		return x
	}

	n = n + x/2
	n = n - (n % x)
	return n
}

func (vs *VideoStream) getTranscodeArgs(segments string) []string {
	args := []string{
		"-map", "0:V:0",
	}

	if vs.quality == Original {
		args = append(args,
			"-c:v", "copy",
		)
		return args
	}

	args = append(args, Settings.HwAccel.EncodeFlags...)
	width := int32(float64(vs.quality.Height()) / float64(vs.file.Info.Video.Height) * float64(vs.file.Info.Video.Width))
	// force a width that is a multiple of two else some apps behave badly.
	width = closestMultiple(width, 2)
	args = append(args,
		"-vf", fmt.Sprintf(Settings.HwAccel.ScaleFilter, width, vs.quality.Height()),
		// Even less sure but bufsize are 5x the avergae bitrate since the average bitrate is only
		// useful for hls segments.
		"-bufsize", fmt.Sprint(vs.quality.MaxBitrate()*5),
		"-b:v", fmt.Sprint(vs.quality.AverageBitrate()),
		"-maxrate", fmt.Sprint(vs.quality.MaxBitrate()),
		// Force segments to be split exactly on keyframes (only works when transcoding)
		// forced-idr is needed to force keyframes to be an idr-frame (by default it can be any i frames)
		// without this option, some hardware encoders uses others i-frames and the -f segment can't cut at them.
		"-forced-idr", "1",
		"-force_key_frames", segments,
		// make ffmpeg globaly less buggy
		"-strict", "-2",
	)
	return args
}
