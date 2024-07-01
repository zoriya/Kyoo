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
	NewStream(file, ret, &ret.Stream)
	return ret
}

func (vs *VideoStream) getFlags() Flags {
	if vs.quality == Original {
		return VideoF | Transmux
	}
	return VideoF
}

func (vs *VideoStream) getSegmentName() string {
	return fmt.Sprintf("segment-%s-%%d.m4s", vs.quality)
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

func (ts *VideoStream) GetIndex() (string, error) {
	// playlist type is event since we can append to the list if Keyframe.IsDone is false.
	// start time offset makes the stream start at 0s instead of ~3segments from the end (requires version 6 of hls)
	index := `#EXTM3U
#EXT-X-VERSION:7
#EXT-X-PLAYLIST-TYPE:EVENT
#EXT-X-START:TIME-OFFSET=0
#EXT-X-MEDIA-SEQUENCE:0
#EXT-X-INDEPENDENT-SEGMENTS
#EXT-X-MAP:URI="init.mp4"
`
	index += fmt.Sprintf("#EXT-X-TARGETDURATION:%d\n", int(OptimalFragmentDuration)+1)
	length, is_done := ts.file.Keyframes.Length()

	for segment := int32(0); segment < length-1; segment++ {
		index += fmt.Sprintf("#EXTINF:%.6f\n", ts.file.Keyframes.Get(segment+1)-ts.file.Keyframes.Get(segment))
		index += fmt.Sprintf("segment-%d.m4s\n", segment)
	}
	// do not forget to add the last segment between the last keyframe and the end of the file
	// if the keyframes extraction is not done, do not bother to add it, it will be retrieval on the next index retrieval
	if is_done {
		index += fmt.Sprintf("#EXTINF:%.6f\n", float64(ts.file.Info.Duration)-ts.file.Keyframes.Get(length-1))
		index += fmt.Sprintf("segment-%d.m4s\n", length-1)
		index += `#EXT-X-ENDLIST`
	}
	return index, nil
}
