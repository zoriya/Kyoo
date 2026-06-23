package src

import (
	"context"
	"fmt"
	"log/slog"
)

type VideoStream struct {
	Stream
	video   *Video
	quality VideoQuality
}

func (t *Transcoder) NewVideoStream(ctx context.Context, file *FileStream, idx uint32, quality VideoQuality) (*VideoStream, error) {
	ctx = context.WithoutCancel(ctx)
	slog.InfoContext(ctx, "creating a new video stream", "path", file.Info.Path, "idx", idx, "quality", quality)

	keyframes, err := t.metadataService.GetKeyframes(ctx, file.Info, true, idx)
	if err != nil {
		return nil, err
	}

	ret := new(VideoStream)
	ret.quality = quality
	for _, video := range file.Info.Videos {
		if video.Index == idx {
			ret.video = &video
			break
		}
	}
	if ret.video == nil {
		return nil, fmt.Errorf("no video track with index %d", idx)
	}

	NewStream(file, keyframes, ret, &ret.Stream)
	return ret, nil
}

func (vs *VideoStream) getFlags() Flags {
	if vs.quality == Original {
		return VideoF | Transmux
	}
	return VideoF
}

func (vs *VideoStream) getOutPath(encoder_id int) string {
	return fmt.Sprintf("%s/segment-%s-%d-%%d.mp4", vs.file.Out, vs.quality, encoder_id)
}

func (vs *VideoStream) getInitPath() string {
	return fmt.Sprintf("%s/init-%s.mp4", vs.file.Out, vs.quality)
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
		"-map", fmt.Sprintf("0:V:%d", vs.video.Index),
	}

	if vs.quality == Original {
		args = append(args,
			"-c:v", "copy",
		)
		return args
	}

	args = append(args, Settings.HwAccel.EncodeFlags...)

	quality := vs.quality
	if vs.quality != NoResize {
		width := int32(float64(vs.quality.Height()) / float64(vs.video.Height) * float64(vs.video.Width))
		// force a width that is a multiple of two else some apps behave badly.
		width = closestMultiple(width, 2)
		if Settings.HwAccel.ScaleFilter != "" {
			args = append(args,
				"-vf", fmt.Sprintf(Settings.HwAccel.ScaleFilter, width, vs.quality.Height()),
			)
		}
	} else {
		if Settings.HwAccel.NoResizeFilter != "" {
			args = append(args, "-vf", Settings.HwAccel.NoResizeFilter)
		}

		// NoResize doesn't have bitrate info, fallback to a know quality higher or equal.
		for _, q := range VideoQualities {
			if q.Height() >= vs.video.Height {
				quality = q
				break
			}
		}
	}
	args = append(args,
		// Even less sure but bufsize are 5x the average bitrate since the average bitrate is only
		// useful for hls segments.
		"-bufsize", fmt.Sprint(quality.MaxBitrate()*5),
		"-b:v", fmt.Sprint(quality.AverageBitrate()),
		"-maxrate", fmt.Sprint(quality.MaxBitrate()),
		// Force segments to be split exactly on keyframes (only works when transcoding)
		// forced-idr is needed to force keyframes to be an idr-frame (by default it can be any i frames)
		// without this option, some hardware encoders uses others i-frames and the -f segment can't cut at them.
		"-forced-idr", "1",
		"-force_key_frames", segments,
		// make ffmpeg globally less buggy
		"-strict", "-2",
	)
	return args
}
