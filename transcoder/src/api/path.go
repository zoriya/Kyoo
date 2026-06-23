package api

import (
	"encoding/base64"
	"net/http"
	"path/filepath"
	"strings"

	"github.com/labstack/echo/v5"
	"github.com/zoriya/kyoo/transcoder/src"
)

func getPath(c *echo.Context) (string, string, error) {
	return getPathS(c.Param("path"))
}

func getPathS(key string) (string, string, error) {
	if key == "" {
		return "", "", echo.NewHTTPError(http.StatusBadRequest, "Missing resouce path.")
	}
	pathb, err := base64.RawURLEncoding.DecodeString(key)
	if err != nil {
		return "", "", echo.NewHTTPError(http.StatusBadRequest, "Invalid path. Should be base64url (without padding) encoded.")
	}
	path := filepath.Clean(string(pathb))
	if !filepath.IsAbs(path) {
		return "", "", echo.NewHTTPError(http.StatusBadRequest, "Absolute path required.")
	}
	if !strings.HasPrefix(path, src.Settings.SafePath+"/") {
		return "", "", echo.NewHTTPError(http.StatusBadRequest, "Selected path is not marked as safe.")
	}
	hash, err := getHash(path)
	if err != nil {
		return "", "", echo.NewHTTPError(http.StatusNotFound, "File does not exist")
	}

	return path, hash, nil
}

func getHash(path string) (string, error) {
	return src.ComputeSha(path)
}

func sanitizePath(path string) error {
	if strings.Contains(path, "/") || strings.Contains(path, "..") {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid parameter. Can't contains path delimiters or ..")
	}
	return nil
}
