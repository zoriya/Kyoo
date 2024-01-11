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

func GetPath(resource string, slug string) (*string, error) {
	url := os.Getenv("API_URL")
	if url == "" {
		url = "http://back:5000"
	}
	key := os.Getenv("KYOO_APIKEYS")
	if key == "" {
		return nil, errors.New("missing api keys")
	}
	key = strings.Split(key, ",")[0]

	req, err := http.NewRequest("GET", strings.Join([]string{url, resource, slug}, "/"), nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("X-API-KEY", key)
	res, err := client.Do(req)
	if err != nil {
		return nil, err
	}

	if res.StatusCode != 200 {
		return nil, echo.NewHTTPError(
			http.StatusNotAcceptable,
			fmt.Sprintf("No %s found with the slug %s.", resource, slug),
		)
	}

	defer res.Body.Close()
	ret := Item{}
	err = json.NewDecoder(res.Body).Decode(&ret)
	if err != nil {
		return nil, err
	}

	return &ret.Path, nil
}
