package src

import "log"

func DetectHardwareAccel() HwAccelT {
	name := GetEnvOr("GOTRANSCODER_HWACCEL", "disabled")
	log.Printf("Using hardware acceleration: %s", name)

	switch name {
	case "nvidia":
		return HwAccelT{
			Name: "nvidia",
			DecodeFlags: []string{
				// TODO: check if this can always be enabled (for example with weird video formats)
				"-hwaccel", "cuda",
				// this flag prevents data to go from gpu space to cpu space
				// it forces the whole dec/enc to be on the gpu. We want that.
				"-hwaccel_output_format", "cuda",
			},
			EncodeFlags: []string{
				"-c:v", "h264_nvenc",
				"-preset", "fast",
			},
			ScaleFilter: "hwupload_cuda,scale_cuda=%d:%d:force_original_aspect_ratio=decrease",
		}
	default:
		return HwAccelT{
			Name:        "disabled",
			DecodeFlags: []string{},
			EncodeFlags: []string{
				"-c:v", "libx264",
				// superfast or ultrafast would produce a file extremly big so we prever veryfast or faster.
				"-preset", "faster",
			},
			ScaleFilter: "scale=%d:%d:force_original_aspect_ratio=decrease",
		}
	}
}
