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
// Path: /direct
func DirectStream(c echo.Context) error {
	path, err := GetPath(c)
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
// Path: /master.m3u8
func (h *Handler) GetMaster(c echo.Context) error {
	client, err := GetClientId(c)
	if err != nil {
		return err
	}
	path, err := GetPath(c)
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
// Path: /:quality/index.m3u8
func (h *Handler) GetVideoIndex(c echo.Context) error {
	quality, err := src.QualityFromString(c.Param("quality"))
	if err != nil {
		return err
	}
	client, err := GetClientId(c)
	if err != nil {
		return err
	}
	path, err := GetPath(c)
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
// Path: /audio/:audio/index.m3u8
func (h *Handler) GetAudioIndex(c echo.Context) error {
	audio, err := strconv.ParseInt(c.Param("audio"), 10, 32)
	if err != nil {
		return err
	}
	client, err := GetClientId(c)
	if err != nil {
		return err
	}
	path, err := GetPath(c)
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
// Path: /:quality/segments-:chunk.ts
func (h *Handler) GetVideoSegment(c echo.Context) error {
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
	path, err := GetPath(c)
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
// Path: /audio/:audio/segments-:chunk.ts
func (h *Handler) GetAudioSegment(c echo.Context) error {
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
	path, err := GetPath(c)
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
// Path: /info
func (h *Handler) GetInfo(c echo.Context) error {
	path, err := GetPath(c)
	if err != nil {
		return err
	}

	ret, err := src.GetInfo(path)
	if err != nil {
		return err
	}
	// Run extractors to have them in cache
	h.extractor.RunExtractor(ret.Path, ret.Sha, &ret.Subtitles)
	go h.thumbnails.ExtractThumbnail(
		ret.Path,
		fmt.Sprintf("%s/thumbnails.png", c.Request().Header.Get("X-Route")),
	)
	return c.JSON(http.StatusOK, ret)
}

// Get attachments
//
// Get a specific attachment.
//
// Path: /attachment/:name
func (h *Handler) GetAttachment(c echo.Context) error {
	name := c.Param("name")

	if err := SanitizePath(name); err != nil {
		return err
	}

	wait, ok := h.extractor.Extract(sha)
	if !ok {
		return echo.NewHTTPError(http.StatusBadRequest, "Not extracted yet. Call /info to extract.")
	}
	<-wait

	path := fmt.Sprintf("%s/%s/att/%s", src.Settings.Metadata, sha, name)
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

	path := fmt.Sprintf("%s/%s/sub/%s", src.Settings.Metadata, sha, name)
	return c.File(path)
}

// Get thumbnail sprite
//
// Get a sprite file containing all the thumbnails of the show.
//
// Path: /thumbnails.png
func (h *Handler) GetThumbnails(c echo.Context) error {
	path, err := GetPath(c)
	if err != nil {
		return err
	}

	out, err := h.thumbnails.ExtractThumbnail(
		path,
		fmt.Sprintf("%s/thumbnails.png", c.Request().Header.Get("X-Route")),
	)
	if err != nil {
		return err
	}

	return c.File(fmt.Sprintf("%s/sprite.png", out))
}

// Get thumbnail vtt
//
// Get a vtt file containing timing/position of thumbnails inside the sprite file.
// https://developer.bitmovin.com/playback/docs/webvtt-based-thumbnails for more info.
//
// Path: /:resource/:slug/thumbnails.vtt
func (h *Handler) GetThumbnailsVtt(c echo.Context) error {
	path, err := GetPath(c)
	if err != nil {
		return err
	}

	out, err := h.thumbnails.ExtractThumbnail(
		path,
		fmt.Sprintf("%s/thumbnails.png", c.Request().Header.Get("X-Route")),
	)
	if err != nil {
		return err
	}

	return c.File(fmt.Sprintf("%s/sprite.vtt", out))
}

type Handler struct {
	transcoder *src.Transcoder
	extractor  *src.Extractor
	thumbnails *src.ThumbnailsCreator
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
		thumbnails: src.NewThumbnailsCreator(),
	}

	e.GET("/direct", DirectStream)
	e.GET("/master.m3u8", h.GetMaster)
	e.GET("/:quality/index.m3u8", h.GetVideoIndex)
	e.GET("/audio/:audio/index.m3u8", h.GetAudioIndex)
	e.GET("/:quality/:chunk", h.GetVideoSegment)
	e.GET("/audio/:audio/:chunk", h.GetAudioSegment)
	e.GET("/info", h.GetInfo)
	e.GET("/thumbnails.png", h.GetThumbnails)
	e.GET("/thumbnails.vtt", h.GetThumbnailsVtt)
	e.GET("/attachment/:name", h.GetAttachment)
	e.GET("/subtitle/:name", h.GetSubtitle)

	e.Logger.Fatal(e.Start(":7666"))
}
