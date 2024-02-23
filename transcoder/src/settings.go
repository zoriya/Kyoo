package src

import "os"

func GetEnvOr(env string, def string) string {
	out := os.Getenv(env)
	if out == "" {
		return def
	}
	return out
}

type SettingsT struct {
	Outpath  string
	Metadata string
	HwAccel  HwAccelT
}

type HwAccelT struct {
	Name        string
	DecodeFlags []string
	EncodeFlags []string
	ScaleFilter string
}

var Settings = SettingsT{
	Outpath:  GetEnvOr("GOCODER_CACHE_ROOT", "/cache"),
	Metadata: GetEnvOr("GOCODER_METADATA_ROOT", "/metadata"),
	HwAccel:  DetectHardwareAccel(),
}
