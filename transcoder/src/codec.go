package src

import (
	"fmt"
	"strings"

	"github.com/zoriya/go-mediainfo"
)

// convert mediainfo to RFC 6381, waiting for either of those tickets to be resolved:
//
//	https://sourceforge.net/p/mediainfo/feature-requests/499
//	https://trac.ffmpeg.org/ticket/6617
//
// this code is addapted from https://github.com/jellyfin/jellyfin/blob/master/Jellyfin.Api/Helpers/HlsCodecStringHelpers.cs
func GetMimeCodec(mi *mediainfo.File, kind mediainfo.StreamKind, i int) *string {
	codec := Or(
		mi.Parameter(kind, i, "InternetMediaType"),
		mi.Parameter(kind, i, "Format"),
	)

	switch codec {
	case "video/H264", "AVC":
		ret := "avc1"
		info := strings.Split(strings.ToLower(mi.Parameter(kind, i, "Format_Profile")), "@")

		format := info[0]
		switch format {
		case "high":
			ret += ".6400"
		case "main":
			ret += ".4D40"
		case "baseline":
			ret += ".42E0"
		default:
			// Default to constrained baseline if profile is invalid
			ret += ".4240"
		}

		// level format is l3.1 for level 31
		level := ParseFloat(info[1][1:])
		ret += fmt.Sprintf("%02x", int(level*10))
		return &ret

	case "video/H265", "HEVC":
		// The h265 syntax is a bit of a mystery at the time this comment was written.
		// This is what I've found through various sources:
		// FORMAT: [codecTag].[profile].[constraint?].L[level * 30].[UNKNOWN]
		ret := "hvc1"
		info := strings.Split(strings.ToLower(mi.Parameter(kind, i, "Format_Profile")), "@")

		profile := info[0]
		if profile == "main 10" {
			ret += ".2.4"
		} else {
			ret += ".1.4"
		}

		level := ParseFloat(info[1][:1])
		ret += fmt.Sprintf(".L%02X.BO", int(level*30))
		return &ret

	case "AV1":
		// https://aomedia.org/av1/specification/annex-a/
		// FORMAT: [codecTag].[profile].[level][tier].[bitDepth]
		ret := "av01"
		info := strings.Split(strings.ToLower(mi.Parameter(kind, i, "Format_Profile")), "@")

		profile := info[0]
		switch profile {
		case "main":
			ret += ".0"
		case "high":
			ret += ".1"
		case "professional":
			ret += ".2"
		default:
			// Default to Main
			ret += ".0"
		}

		// level is not defined in mediainfo. using a default
		// Default to the maximum defined level 6.3
		level := 19

		bitdepth := ParseUint(mi.Parameter(kind, i, "BitDepth"))
		if bitdepth != 8 && bitdepth != 10 && bitdepth != 12 {
			// Default to 8 bits
			bitdepth = 8
		}

		tierflag := 'M'
		ret += fmt.Sprintf(".%02X%c.%02d", level, tierflag, bitdepth)

		return &ret

	case "AAC":
		ret := "mp4a"

		profile := strings.ToLower(mi.Parameter(kind, i, "Format_AdditionalFeatures"))
		switch profile {
		case "he":
			ret += ".40.5"
		case "lc":
			ret += ".40.2"
		default:
			ret += ".40.2"
		}

		return &ret

	case "audio/opus", "Opus":
		ret := "Opus"
		return &ret

	case "AC-3":
		ret := "mp4a.a5"
		return &ret

	case "audio/x-flac", "FLAC":
		ret := "fLaC"
		return &ret

	default:
		return nil
	}
}
