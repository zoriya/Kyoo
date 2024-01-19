package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
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

func ServeOfflineFile(path string, done <-chan struct{}, c echo.Context) error {
	select {
	case <-done:
		// if the transcode is already finished, no need to do anything, just return the file
		return c.File(path)
	default:
		break
	}

	var f *os.File
	var err error
	for {
		// wait for the file to be created by the transcoder.
		f, err = os.Open(path)
		if err == nil {
			break
		}
		time.Sleep(2 * time.Second)
	}
	defer f.Close()

	// Offline transcoding always return a mkv and video/webm allow some browser to play a mkv video
	c.Response().Header().Set(echo.HeaderContentType, "video/webm")
	c.Response().Header().Set("Trailer", echo.HeaderContentLength)
	c.Response().WriteHeader(http.StatusOK)

	buffer := make([]byte, 1024)
	not_done := true

	for not_done {
		select {
		case <-done:
			info, err := f.Stat()
			if err != nil {
				log.Printf("Stats error %s", err)
				return err
			}
			c.Response().Header().Set(echo.HeaderContentLength, fmt.Sprint(info.Size()))
			c.Response().WriteHeader(http.StatusOK)
			not_done = false
		case <-time.After(5 * time.Second):
		}
	read:
		for {
			size, err := f.Read(buffer)
			if size == 0 && err == io.EOF {
				break read
			}
			if err != nil && err != io.EOF {
				return err
			}

			_, err = c.Response().Writer.Write(buffer[:size])
			if err != nil {
				log.Printf("Could not write transcoded file to response.")
				return nil
			}
		}
		c.Response().Flush()
	}
	return nil
}
