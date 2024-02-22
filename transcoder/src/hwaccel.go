package src

func DetectHardwareAccel() HwAccelT {
	name := "disabled"
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
		}
	}
}
