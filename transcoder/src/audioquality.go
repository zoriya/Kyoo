package src

import (
	"net/http"

	"github.com/labstack/echo/v4"
)

type AudioQuality string

const (
	K128      AudioQuality = "128k"
	K192      AudioQuality = "192k"
	K256      AudioQuality = "256k"
	K320      AudioQuality = "320k"
	K512      AudioQuality = "512k"
	AOriginal AudioQuality = "original"
)

var AudioQualities = []AudioQuality{K128, K192, K256, K320, K512}

func AudioQualityFromString(str string) (AudioQuality, error) {
	if str == string(AOriginal) {
		return AOriginal, nil
	}

	for _, quality := range AudioQualities {
		if string(quality) == str {
			return quality, nil
		}
	}
	return AOriginal, echo.NewHTTPError(http.StatusBadRequest, "Invalid quality")
}

func (a AudioQuality) Bitrate() uint32 {
	switch a {
	case K128:
		return 128_000
	case K192:
		return 192_000
	case K256:
		return 256_000
	case K320:
		return 320_000
	case K512:
		return 512_000
	case AOriginal:
		panic("Original quality must be handled specially")
	}
	panic("Invalid quality value")
}

func (audio *Audio) Quality() AudioQuality {
	for _, quality := range AudioQualities {
		if quality.Bitrate() >= audio.Bitrate {
			return quality
		}
	}
	return K128
}
