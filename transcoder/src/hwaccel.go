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
			// if the decode goes into system memory, we need to prepend the filters with "hwupload_cuda".
			// since we use hwaccel_output_format, decoded data stays in gpu memory so we must not specify it (it errors)
			ScaleFilter: "scale_cuda=%d:%d",
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
			// we could put :force_original_aspect_ratio=decrease:force_divisible_by=2 here but we already calculate a correct width and
			// aspect ratio in our code so there is no need.
			ScaleFilter: "scale=%d:%d",
		}
	}
}
