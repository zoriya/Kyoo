package main

import (
	"crypto/sha1"
	"encoding/base64"
	"encoding/hex"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/labstack/echo/v4"
	"github.com/zoriya/kyoo/transcoder/src"
)

func GetPath(c echo.Context) (string, string, error) {
	key := c.Param("path")
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
	if !strings.HasPrefix(path, src.Settings.SafePath) {
		return "", "", echo.NewHTTPError(http.StatusBadRequest, "Selected path is not marked as safe.")
	}
	hash, err := getHash(path)
	if err != nil {
		return "", "", echo.NewHTTPError(http.StatusNotFound, "File does not exist")
	}

	return path, hash, nil
}

func getHash(path string) (string, error) {
	info, err := os.Stat(path)
	if err != nil {
		return "", err
	}
	h := sha1.New()
	h.Write([]byte(path))
	h.Write([]byte(info.ModTime().String()))
	sha := hex.EncodeToString(h.Sum(nil))
	return sha, nil
}

func SanitizePath(path string) error {
	if strings.Contains(path, "/") || strings.Contains(path, "..") {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid parameter. Can't contains path delimiters or ..")
	}
	return nil
}

func GetClientId(c echo.Context) (string, error) {
	key := c.Request().Header.Get("X-CLIENT-ID")
	if key == "" {
		return "", echo.NewHTTPError(http.StatusBadRequest, "missing client id. Please specify the X-CLIENT-ID header to a guid constant for the lifetime of the player (but unique per instance)")
	}
	return key, nil
}

func ParseSegment(segment string) (int32, error) {
	var ret int32
	_, err := fmt.Sscanf(segment, "segment-%d.ts", &ret)
	if err != nil {
		return 0, echo.NewHTTPError(http.StatusBadRequest, "Could not parse segment.")
	}
	return ret, nil
}

func ErrorHandler(err error, c echo.Context) {
	code := http.StatusInternalServerError
	var message string
	if he, ok := err.(*echo.HTTPError); ok {
		code = he.Code
		message = fmt.Sprint(he.Message)
	} else {
		c.Logger().Error(err)
		message = "Internal server error"
	}
	c.JSON(code, struct {
		Errors []string `json:"errors"`
	}{Errors: []string{message}})
}
