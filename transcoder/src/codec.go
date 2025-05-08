package src

import (
	"fmt"
	"log"
	"strings"

	"gopkg.in/vansante/go-ffprobe.v2"
)

// convert mediainfo to RFC 6381, waiting for either of those tickets to be resolved:
//
//	https://sourceforge.net/p/mediainfo/feature-requests/499
//	https://trac.ffmpeg.org/ticket/6617
//
// this code is addapted from https://github.com/jellyfin/jellyfin/blob/master/Jellyfin.Api/Helpers/HlsCodecStringHelpers.cs
// and https://git.ffmpeg.org/gitweb/ffmpeg.git/blob/HEAD%3a/libavformat/hlsenc.c#l344
func GetMimeCodec(stream *ffprobe.Stream) *string {
	switch stream.CodecName {
	case "h264":
		ret := "avc1"

		switch strings.ToLower(stream.Profile) {
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

		ret += fmt.Sprintf("%02x", stream.Level)
		return &ret

	case "h265", "hevc":
		// The h265 syntax is a bit of a mystery at the time this comment was written.
		// This is what I've found through various sources:
		// FORMAT: [codecTag].[profile].[constraint?].L[level * 30].[UNKNOWN]
		ret := "hvc1"

		if stream.Profile == "main 10" {
			ret += ".2.4"
		} else {
			ret += ".1.4"
		}

		ret += fmt.Sprintf(".L%02X.BO", stream.Level)
		return &ret

	case "av1":
		// https://aomedia.org/av1/specification/annex-a/
		// FORMAT: [codecTag].[profile].[level][tier].[bitDepth]
		ret := "av01"

		switch strings.ToLower(stream.Profile) {
		case "main":
			ret += ".0"
		case "high":
			ret += ".1"
		case "professional":
			ret += ".2"
		default:
		}

		// not sure about this field, we want pixel bit depth
		bitdepth := ParseUint(stream.BitsPerRawSample)
		if bitdepth != 8 && bitdepth != 10 && bitdepth != 12 {
			// Default to 8 bits
			bitdepth = 8
		}

		tierflag := 'M'
		ret += fmt.Sprintf(".%02X%c.%02d", stream.Level, tierflag, bitdepth)

		return &ret

	case "aac":
		ret := "mp4a"

		switch strings.ToLower(stream.Profile) {
		case "he":
			ret += ".40.5"
		case "lc":
			ret += ".40.2"
		default:
			ret += ".40.2"
		}

		return &ret

	case "mp3":
		ret := "mp4a.40.34"
		return &ret

	case "opus":
		ret := "Opus"
		return &ret

	case "ac3":
		ret := "mp4a.a5"
		return &ret

	case "eac3":
		ret := "mp4a.a6"
		return &ret

	case "flac":
		ret := "fLaC"
		return &ret

	case "alac":
		ret := "alac"
		return &ret

	// MIME type codec values: https://cconcolato.github.io/media-mime-support/#video/mp4;%20codecs=%22dtsc%22
	// Profiles supported by ffmpeg: https://github.com/FFmpeg/FFmpeg/blob/1b643e3f65d75a4e6a25986466254bdd4fc1a01a/libavcodec/profiles.c#L40-L50
	case "dts":
		ret := "dts"
		switch strings.ToLower(stream.Profile) {
		case "dts-hd hra": // DTS-HD High Resolution Audio
			ret += "h"
		case "dts-hd ma": // DTS-HD Master Audio
			ret += "l"
		case "dts-hd ma + dts:x": // DTS-HD Master Audio + DTS:X
			fallthrough
		case "dts-hd ma + dts-hd imax": // DTS-HD Master Audio + DTS:X IMAX (?)
			ret += "x"
		case "dts express": // DTS Express, AKA DTS LBR
			ret += "e"
		case "dts": // Plain DTS. The original codec name was "Digital Coherent Acoustics", which is where the "c" comes from. All other codecs are a superset of "dtsc".
			fallthrough
		// Profiles with unknown MIME type codec value(s)
		case "dts-es": // DTS-ES (Extended Surround)
			fallthrough
		case "dts 96/24": // DTS 96/24
			fallthrough
		default:
			ret += "c"
		}
		return &ret

	default:
		log.Printf("No known mime format for: %s", stream.CodecName)
		return nil
	}
}
