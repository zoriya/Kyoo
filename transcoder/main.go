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
// Path: /:path/direct
func DirectStream(c echo.Context) error {
	path, _, err := GetPath(c)
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
// Path: /:path/master.m3u8
func (h *Handler) GetMaster(c echo.Context) error {
	client, err := GetClientId(c)
	if err != nil {
		return err
	}
	path, sha, err := GetPath(c)
	if err != nil {
		return err
	}

	ret, err := h.transcoder.GetMaster(path, client, sha)
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
// Path: /:path/:video/:quality/index.m3u8
func (h *Handler) GetVideoIndex(c echo.Context) error {
	video, err := strconv.ParseInt(c.Param("video"), 10, 32)
	if err != nil {
		return err
	}
	quality, err := src.QualityFromString(c.Param("quality"))
	if err != nil {
		return err
	}
	client, err := GetClientId(c)
	if err != nil {
		return err
	}
	path, sha, err := GetPath(c)
	if err != nil {
		return err
	}

	ret, err := h.transcoder.GetVideoIndex(path, uint32(video), quality, client, sha)
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
// Path: /:path/audio/:audio/index.m3u8
func (h *Handler) GetAudioIndex(c echo.Context) error {
	audio, err := strconv.ParseInt(c.Param("audio"), 10, 32)
	if err != nil {
		return err
	}
	client, err := GetClientId(c)
	if err != nil {
		return err
	}
	path, sha, err := GetPath(c)
	if err != nil {
		return err
	}

	ret, err := h.transcoder.GetAudioIndex(path, uint32(audio), client, sha)
	if err != nil {
		return err
	}
	return c.String(http.StatusOK, ret)
}

// Get transmuxed chunk
//
// Retrieve a chunk of a transmuxed video.
//
// Path: /:path/:video/:quality/segments-:chunk.ts
func (h *Handler) GetVideoSegment(c echo.Context) error {
	video, err := strconv.ParseInt(c.Param("video"), 10, 32)
	if err != nil {
		return err
	}
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
	path, sha, err := GetPath(c)
	if err != nil {
		return err
	}

	ret, err := h.transcoder.GetVideoSegment(
		path,
		uint32(video),
		quality,
		segment,
		client,
		sha,
	)
	if err != nil {
		return err
	}
	return c.File(ret)
}

// Get audio chunk
//
// Retrieve a chunk of a transcoded audio.
//
// Path: /:path/audio/:audio/segments-:chunk.ts
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
	path, sha, err := GetPath(c)
	if err != nil {
		return err
	}

	ret, err := h.transcoder.GetAudioSegment(path, uint32(audio), segment, client, sha)
	if err != nil {
		return err
	}
	return c.File(ret)
}

// Identify
//
// Identify metadata about a file.
//
// Path: /:path/info
func (h *Handler) GetInfo(c echo.Context) error {
	path, sha, err := GetPath(c)
	if err != nil {
		return err
	}

	ret, err := h.metadata.GetMetadata(path, sha)
	if err != nil {
		return err
	}
	err = ret.SearchExternalSubtitles()
	if err != nil {
		fmt.Printf("Couldn't find external subtitles: %v", err)
	}
	return c.JSON(http.StatusOK, ret)
}

// Get attachments
//
// Get a specific attachment.
//
// Path: /:path/attachment/:name
func (h *Handler) GetAttachment(c echo.Context) error {
	_, sha, err := GetPath(c)
	if err != nil {
		return err
	}
	name := c.Param("name")
	if err := SanitizePath(name); err != nil {
		return err
	}

	ret, err := h.metadata.GetAttachmentPath(sha, false, name)
	if err != nil {
		return err
	}
	return c.File(ret)
}

// Get subtitle
//
// Get a specific subtitle.
//
// Path: /:path/subtitle/:name
func (h *Handler) GetSubtitle(c echo.Context) error {
	_, sha, err := GetPath(c)
	if err != nil {
		return err
	}
	name := c.Param("name")
	if err := SanitizePath(name); err != nil {
		return err
	}

	ret, err := h.metadata.GetAttachmentPath(sha, true, name)
	if err != nil {
		return err
	}
	return c.File(ret)
}

// Get thumbnail sprite
//
// Get a sprite file containing all the thumbnails of the show.
//
// Path: /:path/thumbnails.png
func (h *Handler) GetThumbnails(c echo.Context) error {
	path, sha, err := GetPath(c)
	if err != nil {
		return err
	}
	sprite, _, err := h.metadata.GetThumb(path, sha)
	if err != nil {
		return err
	}

	return c.File(sprite)
}

// Get thumbnail vtt
//
// Get a vtt file containing timing/position of thumbnails inside the sprite file.
// https://developer.bitmovin.com/playback/docs/webvtt-based-thumbnails for more info.
//
// Path: /:path/:resource/:slug/thumbnails.vtt
func (h *Handler) GetThumbnailsVtt(c echo.Context) error {
	path, sha, err := GetPath(c)
	if err != nil {
		return err
	}
	_, vtt, err := h.metadata.GetThumb(path, sha)
	if err != nil {
		return err
	}

	return c.File(vtt)
}

type Handler struct {
	transcoder *src.Transcoder
	metadata   *src.MetadataService
}

func main() {
	e := echo.New()
	e.Use(middleware.Logger())
	e.HTTPErrorHandler = ErrorHandler

	metadata, err := src.NewMetadataService()
	if err != nil {
		e.Logger.Fatal(err)
		return
	}
	transcoder, err := src.NewTranscoder(metadata)
	if err != nil {
		e.Logger.Fatal(err)
		return
	}
	h := Handler{
		transcoder: transcoder,
		metadata:   metadata,
	}

	g := e.Group(src.Settings.RoutePrefix)
	g.GET("/:path/direct", DirectStream)
	g.GET("/:path/direct/:identifier", DirectStream)
	g.GET("/:path/master.m3u8", h.GetMaster)
	g.GET("/:path/:video/:quality/index.m3u8", h.GetVideoIndex)
	g.GET("/:path/audio/:audio/index.m3u8", h.GetAudioIndex)
	g.GET("/:path/:video/:quality/:chunk", h.GetVideoSegment)
	g.GET("/:path/audio/:audio/:chunk", h.GetAudioSegment)
	g.GET("/:path/info", h.GetInfo)
	g.GET("/:path/thumbnails.png", h.GetThumbnails)
	g.GET("/:path/thumbnails.vtt", h.GetThumbnailsVtt)
	g.GET("/:path/attachment/:name", h.GetAttachment)
	g.GET("/:path/subtitle/:name", h.GetSubtitle)

	e.Logger.Fatal(e.Start(":7666"))
}
