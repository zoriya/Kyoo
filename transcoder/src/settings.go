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
	Outpath   string
	SafePath  string
	JwksUrl   string
	JwtIssuer string
	HwAccel   HwAccelT
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
	Outpath:   path.Join(GetEnvOr("GOCODER_CACHE_ROOT", "/cache"), "kyoo_cache"),
	SafePath:  GetEnvOr("GOCODER_SAFE_PATH", "/video"),
	JwksUrl:   GetEnvOr("JWKS_URL", "http://auth:4568/.well-known/jwks.json"),
	JwtIssuer: GetEnvOr("JWT_ISSUER", "http://localhost:8901"),
	HwAccel:   DetectHardwareAccel(),
}
