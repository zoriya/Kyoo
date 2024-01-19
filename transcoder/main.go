package main

import (
	"fmt"
	"net/http"
	"strconv"

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

// Download item
//
// Transcode the video/audio to the selected quality for offline use.
// This route will be slow and stream an incomplete file, this is not meant to be used while
// streaming.
//
// Path: /:resource/:slug/offline?quality=:quality
func (h *Handler) GetOffline(c echo.Context) error {
	resource := c.Param("resource")
	slug := c.Param("slug")
	quality, err := src.QualityFromString(c.QueryParam("quality"))
	if err != nil {
		return err
	}

	path, err := GetPath(resource, slug)
	if err != nil {
		return err
	}

	ret, err := h.downloader.GetOffline(path, quality)
	if err != nil {
		return err
	}
	return c.String(http.StatusOK, ret)
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
	audio, err := strconv.ParseInt(c.Param("audio"), 10, 32)
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

	ret, err := h.transcoder.GetAudioIndex(path, int32(audio), client)
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
	audio, err := strconv.ParseInt(c.Param("audio"), 10, 32)
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

	ret, err := h.transcoder.GetAudioSegment(path, int32(audio), segment, client)
	if err != nil {
		return err
	}
	return c.File(ret)
}

// Identify
//
// Identify metadata about a file.
//
// Path: /:resource/:slug/info
func (h *Handler) GetInfo(c echo.Context) error {
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
	h.extractor.RunExtractor(ret.Path, ret.Sha, &ret.Subtitles)
	return c.JSON(http.StatusOK, ret)
}

// Get attachments
//
// Get a specific attachment.
//
// Path: /:sha/attachment/:name
func (h *Handler) GetAttachment(c echo.Context) error {
	sha := c.Param("sha")
	name := c.Param("name")

	if err := SanitizePath(sha); err != nil {
		return err
	}
	if err := SanitizePath(name); err != nil {
		return err
	}

	wait, ok := h.extractor.Extract(sha)
	if !ok {
		return echo.NewHTTPError(http.StatusBadRequest, "Not extracted yet. Call /info to extract.")
	}
	<-wait

	path := fmt.Sprintf("%s/%s/att/%s", src.GetMetadataPath(), sha, name)
	return c.File(path)
}

// Get subtitle
//
// Get a specific subtitle.
//
// Path: /:sha/subtitle/:name
func (h *Handler) GetSubtitle(c echo.Context) error {
	sha := c.Param("sha")
	name := c.Param("name")

	if err := SanitizePath(sha); err != nil {
		return err
	}
	if err := SanitizePath(name); err != nil {
		return err
	}

	wait, ok := h.extractor.Extract(sha)
	if !ok {
		return echo.NewHTTPError(http.StatusBadRequest, "Not extracted yet. Call /info to extract.")
	}
	<-wait

	path := fmt.Sprintf("%s/%s/sub/%s", src.GetMetadataPath(), sha, name)
	return c.File(path)
}

type Handler struct {
	transcoder *src.Transcoder
	extractor  *src.Extractor
	downloader *src.Downloader
}

func main() {
	e := echo.New()
	e.Use(middleware.Logger())
	e.HTTPErrorHandler = ErrorHandler

	transcoder, err := src.NewTranscoder()
	if err != nil {
		e.Logger.Fatal(err)
		return
	}
	h := Handler{
		transcoder: transcoder,
		extractor:  src.NewExtractor(),
		downloader: src.NewDownloader(),
	}

	e.GET("/:resource/:slug/direct", DirectStream)
	e.GET("/:resource/:slug/offline", h.GetOffline)
	e.GET("/:resource/:slug/master.m3u8", h.GetMaster)
	e.GET("/:resource/:slug/:quality/index.m3u8", h.GetVideoIndex)
	e.GET("/:resource/:slug/audio/:audio/index.m3u8", h.GetAudioIndex)
	e.GET("/:resource/:slug/:quality/:chunk", h.GetVideoSegment)
	e.GET("/:resource/:slug/audio/:audio/:chunk", h.GetAudioSegment)
	e.GET("/:resource/:slug/info", h.GetInfo)
	e.GET("/:sha/attachment/:name", h.GetAttachment)
	e.GET("/:sha/subtitle/:name", h.GetSubtitle)

	e.Logger.Fatal(e.Start(":7666"))
}
