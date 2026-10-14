package src

import (
	"os"
	"path"
	"strings"
	"time"
)

func GetEnvOr(env string, def string) string {
	out := os.Getenv(env)
	if out == "" {
		return def
	}
	return out
}

type SettingsT struct {
	Outpath  string
	SafePath string
	JwksUrl  string
	HwAccel  HwAccelT
	// TTL for completed segments in the shared (S3) segment cache.
	// 0 disables eviction. Only used when S3_BUCKET_NAME is set.
	SegmentsTTL time.Duration
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
	Outpath:     path.Join(GetEnvOr("GOCODER_CACHE_ROOT", "/cache"), "kyoo_cache"),
	SafePath:    strings.TrimRight(GetEnvOr("GOCODER_SAFE_PATH", "/video"), "/"),
	JwksUrl:     os.Getenv("JWKS_URL"),
	HwAccel:     DetectHardwareAccel(),
	SegmentsTTL: parseSegmentsTTL(),
}

func parseSegmentsTTL() time.Duration {
	raw := GetEnvOr("GOCODER_SEGMENTS_TTL", "168h")
	if raw == "0" {
		return 0
	}
	dur, err := time.ParseDuration(raw)
	if err != nil || dur < 0 {
		return 168 * time.Hour
	}
	return dur
}
