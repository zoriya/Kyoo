package src

import (
	"net/http"

	"github.com/labstack/echo/v4"
)

type VideoQuality string

const (
	P240     VideoQuality = "240p"
	P360     VideoQuality = "360p"
	P480     VideoQuality = "480p"
	P720     VideoQuality = "720p"
	P1080    VideoQuality = "1080p"
	P1440    VideoQuality = "1440p"
	P4k      VideoQuality = "4k"
	P8k      VideoQuality = "8k"
	NoResize VideoQuality = "transcode"
	Original VideoQuality = "original"
)

// Purposfully removing Original from this list (since it require special treatments anyways)
var VideoQualities = []VideoQuality{P240, P360, P480, P720, P1080, P1440, P4k, P8k}

func VideoQualityFromString(str string) (VideoQuality, error) {
	if str == string(Original) {
		return Original, nil
	}
	if str == string(NoResize) {
		return NoResize, nil
	}

	for _, quality := range VideoQualities {
		if string(quality) == str {
			return quality, nil
		}
	}
	return Original, echo.NewHTTPError(http.StatusBadRequest, "Invalid quality")
}

// I'm not entierly sure about the values for bitrates. Double checking would be nice.
func (v VideoQuality) AverageBitrate() uint32 {
	switch v {
	case P240:
		return 400_000
	case P360:
		return 800_000
	case P480:
		return 1_200_000
	case P720:
		return 2_400_000
	case P1080:
		return 4_800_000
	case P1440:
		return 9_600_000
	case P4k:
		return 16_000_000
	case P8k:
		return 28_000_000
	case Original:
		panic("Original quality must be handled specially")
	}
	panic("Invalid quality value")
}

func (v VideoQuality) MaxBitrate() uint32 {
	switch v {
	case P240:
		return 700_000
	case P360:
		return 1_400_000
	case P480:
		return 2_100_000
	case P720:
		return 4_000_000
	case P1080:
		return 8_000_000
	case P1440:
		return 12_000_000
	case P4k:
		return 28_000_000
	case P8k:
		return 40_000_000
	case Original:
		panic("Original quality must be handled specially")
	}
	panic("Invalid quality value")
}

func (q VideoQuality) Height() uint32 {
	switch q {
	case P240:
		return 240
	case P360:
		return 360
	case P480:
		return 480
	case P720:
		return 720
	case P1080:
		return 1080
	case P1440:
		return 1440
	case P4k:
		return 2160
	case P8k:
		return 4320
	case Original:
		panic("Original quality must be handled specially")
	}
	panic("Invalid quality value")
}

func (video *Video) Quality() VideoQuality {
	for _, quality := range VideoQualities {
		if quality.Height() >= video.Height || quality.AverageBitrate() >= video.Bitrate {
			return quality
		}
	}
	return P240
}
