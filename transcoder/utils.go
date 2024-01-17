package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/labstack/echo/v4"
)

var client = &http.Client{Timeout: 10 * time.Second}

type Item struct {
	Path string `json:"path"`
}

func GetPath(resource string, slug string) (string, error) {
	url := os.Getenv("API_URL")
	if url == "" {
		url = "http://back:5000"
	}
	key := os.Getenv("KYOO_APIKEYS")
	if key == "" {
		return "", errors.New("missing api keys")
	}
	key = strings.Split(key, ",")[0]

	req, err := http.NewRequest("GET", strings.Join([]string{url, resource, slug}, "/"), nil)
	if err != nil {
		return "", err
	}
	req.Header.Set("X-API-KEY", key)
	res, err := client.Do(req)
	if err != nil {
		return "", err
	}

	if res.StatusCode != 200 {
		return "", echo.NewHTTPError(
			http.StatusNotFound,
			fmt.Sprintf("No %s found with the slug %s.", resource, slug),
		)
	}

	defer res.Body.Close()
	ret := Item{}
	err = json.NewDecoder(res.Body).Decode(&ret)
	if err != nil {
		return "", err
	}

	return ret.Path, nil
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
		return "", errors.New("missing client id. Please specify the X-CLIENT-ID header to a guid constant for the lifetime of the player (but unique per instance)")
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
