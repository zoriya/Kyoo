package src

import (
	"log"
	"os"
)

func DetectHardwareAccel() HwAccelT {
	name := GetEnvOr("GOCODER_HWACCEL", "disabled")
	if name == "disabled" {
		name = GetEnvOr("GOTRANSCODER_HWACCEL", "disabled")
	}
	log.Printf("Using hardware acceleration: %s", name)

	// superfast or ultrafast would produce a file extremely big so we prefer to ignore them. Fast is available on all hwaccel modes
	// so we use that by default.
	// vaapi does not have any presets so this flag is unused for vaapi hwaccel.
	preset := GetEnvOr("GOCODER_PRESET", "fast")

	switch name {
	case "disabled", "cpu":
		return HwAccelT{
			Name:        "disabled",
			DecodeFlags: []string{},
			EncodeFlags: []string{
				"-c:v", "libx264",
				"-preset", preset,
				// sc_threshold is a scene detection mechanism used to create a keyframe when the scene changes
				// this is on by default and inserts keyframes where we don't want to (it also breaks force_key_frames)
				// we disable it to prevents whole scenes from being removed due to the -f segment failing to find the corresponding keyframe
				"-sc_threshold", "0",
				// force 8bits output (by default it keeps the same as the source but 10bits is not playable on some devices)
				"-pix_fmt", "yuv420p",
			},
			// we could put :force_original_aspect_ratio=decrease:force_divisible_by=2 here but we already calculate a correct width and
			// aspect ratio in our code so there is no need.
			ScaleFilter: "scale=%d:%d",
		}
	case "vaapi":
		return HwAccelT{
			Name: name,
			DecodeFlags: []string{
				"-hwaccel", "vaapi",
				"-hwaccel_device", GetEnvOr("GOCODER_VAAPI_RENDERER", "/dev/dri/renderD128"),
				"-hwaccel_output_format", "vaapi",
			},
			EncodeFlags: []string{
				// h264_vaapi does not have any preset or scenecut flags.
				"-c:v", "h264_vaapi",
			},
			// if the hardware decoder could not work and fallbacked to soft decode, we need to instruct ffmpeg to
			// upload back frames to gpu space (after converting them)
			// see https://trac.ffmpeg.org/wiki/Hardware/VAAPI#Encoding for more info
			// we also need to force the format to be nv12 since 10bits is not supported via hwaccel.
			// this filter is equivalent to this pseudocode:
			//
			// if (format != nv12 && format != vaapi) {
			//   convert_to_nv12() (in cpu space, the format is invalid only if hw-decode failed)
			//   hwupload (send to gpu space)
			//   scale_to(width, height, output_format="nv12") (output format doesn't change since we are already in nv12)
			// } else {
			//   _format_has_nothing_to_do (do nothing since the format is already valid)
			//   _hwupload (the format is already a gpu space format so this is also a no-op)
			//   scale_to(width, height, output_format="nv12") (if we are already in nv12 it's only a scale, otherwise it converts to it)
			//     note: nv12 is 8bit format while vaapi can be 10bits or anything else
			// }
			// See https://www.reddit.com/r/ffmpeg/comments/1bqn60w/hardware_accelerated_decoding_without_hwdownload/ for more info
			ScaleFilter: "format=nv12|vaapi,hwupload,scale_vaapi=%d:%d:format=nv12",
			// Exactly the same as above but without the scaling.
			// Yes scale_vaapi is used to convert the format (the `format` filter will pick a format for
			// the next filter so it doesn't work if there is no next filter).
			NoResizeFilter: "format=nv12|vaapi,hwupload,scale_vaapi=format=nv12",
		}
	case "qsv", "intel":
		return HwAccelT{
			Name: name,
			DecodeFlags: []string{
				"-hwaccel", "qsv",
				"-qsv_device", GetEnvOr("GOCODER_QSV_RENDERER", "/dev/dri/renderD128"),
				"-hwaccel_output_format", "qsv",
			},
			EncodeFlags: []string{
				"-c:v", "h264_qsv",
				"-preset", preset,
			},
			// see note on ScaleFilter of the vaapi HwAccel, this is the same filter but adapted to qsv
			ScaleFilter:    "format=nv12|qsv,hwupload,scale_qsv=%d:%d:format=nv12",
			NoResizeFilter: "format=nv12|qsv,hwupload,scale_qsv=format=nv12",
		}
	case "nvidia":
		return HwAccelT{
			Name: "nvidia",
			DecodeFlags: []string{
				"-hwaccel", "cuda",
				// this flag prevents data to go from gpu space to cpu space
				// it forces the whole dec/enc to be on the gpu. We want that.
				"-hwaccel_output_format", "cuda",
			},
			EncodeFlags: []string{
				"-c:v", "h264_nvenc",
				"-preset", preset,
				// the equivalent of -sc_threshold on nvidia.
				"-no-scenecut", "1",
			},
			// see note on ScaleFilter of the vaapi HwAccel, this is the same filter but adapted to cuda
			ScaleFilter:    "format=nv12|cuda,hwupload,scale_cuda=%d:%d:format=nv12",
			NoResizeFilter: "format=nv12|cuda,hwupload,scale_cuda=format=nv12",
		}
	default:
		log.Printf("No hardware accelerator named: %s", name)
		os.Exit(2)
		panic("unreachable")
	}
}
