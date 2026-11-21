package src

import (
	"os"
	"path"
	"strconv"
	"strings"
)

func GetEnvOr(env string, def string) string {
	out := os.Getenv(env)
	if out == "" {
		return def
	}
	return out
}

type SettingsT struct {
	Outpath             string
	DownloadOutpath     string
	SafePath            string
	JwksUrl             string
	HwAccel             HwAccelT
	DownloadConcurrency int
}

type HwAccelT struct {
	Name           string
	DecodeFlags    []string
	EncodeFlags    []string
	NoResizeFilter string
	ScaleFilter    string
}

var Settings = SettingsT{
	// we manually add a folder to make sure we do not delete user data.
	Outpath: path.Join(GetEnvOr("GOCODER_CACHE_ROOT", "/cache"), "kyoo_cache"),
	// inside Outpath so it's also cleared on startup, downloads are only tracked in memory
	DownloadOutpath: path.Join(GetEnvOr("GOCODER_CACHE_ROOT", "/cache"), "kyoo_cache", "downloads"),
	SafePath:        strings.TrimRight(GetEnvOr("GOCODER_SAFE_PATH", "/video"), "/"),
	JwksUrl:         os.Getenv("JWKS_URL"),
	HwAccel:         DetectHardwareAccel(),
	DownloadConcurrency: func() int {
		ret, err := strconv.Atoi(GetEnvOr("GOCODER_DOWNLOAD_CONCURRENCY", "5"))
		if err != nil || ret < 1 {
			return 5
		}
		return ret
	}(),
}
