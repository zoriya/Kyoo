package src

import "fmt"

type VideoStream struct {
	TranscodeStream
	quality Quality
}

func (vs *VideoStream) getOutPath() string {
	return fmt.Sprintf("%s/segment-%s-%%03d.ts", vs.file.Out, vs.quality)
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
		"-strict", "-2",
	}
}
