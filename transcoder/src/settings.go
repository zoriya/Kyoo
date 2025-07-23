package src

import (
	"os"
	"path"
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
	Outpath:  path.Join(GetEnvOr("GOCODER_CACHE_ROOT", "/cache"), "kyoo_cache"),
	SafePath: GetEnvOr("GOCODER_SAFE_PATH", "/video"),
	JwksUrl:  os.Getenv("JWKS_URL"),
	HwAccel:  DetectHardwareAccel(),
}
