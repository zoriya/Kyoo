package main

import (
	"net/http"

	"github.com/zoriya/kyoo/transcoder/src"

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

// Transcode video
//
// Transcode the video to the selected quality.
// This route can take a few seconds to respond since it will way for at least one segment to be
// available.
//
// Path: /:resource/:slug/:quality/index.m3u8
func (h *Handler) GetVideoIndex(c echo.Context) error {
	resource := c.Param("resource")
	slug := c.Param("slug")
	quality, err := src.QualityFromString(c.Param("quality"))
	if err != nil {
		return err
	}

	client, err := GetClientId(c)
	if err != nil {
		return err
	}

	path, err := GetPath(resource, slug)
	if err != nil {
		return err
	}

	ret, err := h.transcoder.GetVideoIndex(path, quality, client)
	if err != nil {
		return err
	}
	return c.String(http.StatusOK, ret)
}

// Transcode audio
//
// Get the selected audio
// This route can take a few seconds to respond since it will way for at least one segment to be
// available.
//
// Path: /:resource/:slug/audio/:audio/index.m3u8
func (h *Handler) GetAudioIndex(c echo.Context) error {
	resource := c.Param("resource")
	slug := c.Param("slug")
	audio := c.Param("audio")

	client, err := GetClientId(c)
	if err != nil {
		return err
	}

	path, err := GetPath(resource, slug)
	if err != nil {
		return err
	}

	ret, err := h.transcoder.GetAudioIndex(path, audio, client)
	if err != nil {
		return err
	}
	return c.String(http.StatusOK, ret)
}

// Get transmuxed chunk
//
// Retrieve a chunk of a transmuxed video.
//
// Path: /:resource/:slug/:quality/segments-:chunk.ts
func (h *Handler) GetVideoSegment(c echo.Context) error {
	resource := c.Param("resource")
	slug := c.Param("slug")
	quality, err := src.QualityFromString(c.Param("quality"))
	if err != nil {
		return err
	}
	segment, err := ParseSegment(c.Param("chunk"))
	if err != nil {
		return err
	}

	client, err := GetClientId(c)
	if err != nil {
		return err
	}

	path, err := GetPath(resource, slug)
	if err != nil {
		return err
	}

	ret, err := h.transcoder.GetVideoSegment(path, quality, segment, client)
	if err != nil {
		return err
	}
	return c.File(ret)
}

// Get audio chunk
//
// Retrieve a chunk of a transcoded audio.
//
// Path: /:resource/:slug/audio/:audio/segments-:chunk.ts
func (h *Handler) GetAudioSegment(c echo.Context) error {
	resource := c.Param("resource")
	slug := c.Param("slug")
	audio := c.Param("audio")
	segment, err := ParseSegment(c.Param("chunk"))
	if err != nil {
		return err
	}

	client, err := GetClientId(c)
	if err != nil {
		return err
	}

	path, err := GetPath(resource, slug)
	if err != nil {
		return err
	}

	ret, err := h.transcoder.GetAudioSegment(path, audio, segment, client)
	if err != nil {
		return err
	}
	return c.File(ret)
}

// Identify
//
// # Identify metadata about a file
//
// Path: /:resource/:slug/info
func GetInfo(c echo.Context) error {
	resource := c.Param("resource")
	slug := c.Param("slug")

	path, err := GetPath(resource, slug)
	if err != nil {
		return err
	}

	ret, err := src.GetInfo(path)
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, ret)
}

type Handler struct {
	transcoder *src.Transcoder
}

func main() {
	e := echo.New()
	e.Use(middleware.Logger())
	e.HTTPErrorHandler = ErrorHandler

	h := Handler{transcoder: src.NewTranscoder()}

	e.GET("/:resource/:slug/direct", DirectStream)
	e.GET("/:resource/:slug/master.m3u8", h.GetMaster)
	e.GET("/:resource/:slug/:quality/index.m3u8", h.GetVideoIndex)
	e.GET("/:resource/:slug/audio/:audio/index.m3u8", h.GetAudioIndex)
	e.GET("/:resource/:slug/:quality/:chunk", h.GetVideoSegment)
	e.GET("/:resource/:slug/audio/:audio/:chunk", h.GetAudioSegment)
	e.GET("/:resource/:slug/info", GetInfo)

	e.Logger.Fatal(e.Start(":7666"))
}
