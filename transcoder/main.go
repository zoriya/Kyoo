package main

import (
	"net/http"

	"github.com/zoriya/kyoo/transcoder/transcoder"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

// Direct video
//
// Retrieve the raw video stream, in the same container as the one on the server. No transcoding or
// transmuxing is done.
//
// Path: /:resource/:slug/direct
func DirectStream(c echo.Context) error {
	resource := c.Param("resource")
	slug := c.Param("slug")

	path, err := GetPath(resource, slug)
	if err != nil {
		return err
	}
	return c.File(path)
}

// Get master playlist
//
// Get a master playlist containing all possible video qualities and audios available for this resource.
// Note that the direct stream is missing (since the direct is not an hls stream) and
// subtitles/fonts are not included to support more codecs than just webvtt.
//
// Path: /:resource/:slug/master.m3u8
func (h *Handler) GetMaster(c echo.Context) error {
	resource := c.Param("resource")
	slug := c.Param("slug")

	client, err := GetClientId(c)
	if err != nil {
		return err
	}

	path, err := GetPath(resource, slug)
	if err != nil {
		return err
	}

	ret, err := h.transcoder.GetMaster(path, client)
	if err != nil {
		return err
	}
	return c.String(http.StatusOK, ret)
}

type Handler struct {
	transcoder *transcoder.Transcoder
}

func main() {
	e := echo.New()
	e.Use(middleware.Logger())
	e.HTTPErrorHandler = ErrorHandler

	h := Handler{}

	e.GET("/:resource/:slug/direct", DirectStream)
	e.GET("/:resource/:slug/master.m3u8", h.GetMaster)

	e.Logger.Fatal(e.Start(":7666"))
}
