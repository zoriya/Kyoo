package main

import (
	"fmt"
	"io"
	"mime"
	"net/http"
	"path/filepath"
	"strconv"

	"github.com/zoriya/kyoo/transcoder/src"
	"github.com/zoriya/kyoo/transcoder/src/api"
	"github.com/zoriya/kyoo/transcoder/src/utils"

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

	ret, err := h.transcoder.GetMaster(c.Request().Context(), path, client, sha)
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

	ret, err := h.transcoder.GetVideoIndex(c.Request().Context(), path, uint32(video), quality, client, sha)
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

	ret, err := h.transcoder.GetAudioIndex(c.Request().Context(), path, uint32(audio), client, sha)
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
		c.Request().Context(),
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

	ret, err := h.transcoder.GetAudioSegment(c.Request().Context(), path, uint32(audio), segment, client, sha)
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

	ret, err := h.metadata.GetMetadata(c.Request().Context(), path, sha)
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
func (h *Handler) GetAttachment(c echo.Context) (err error) {
	_, sha, err := GetPath(c)
	if err != nil {
		return err
	}
	name := c.Param("name")
	if err := SanitizePath(name); err != nil {
		return err
	}

	attachementStream, err := h.metadata.GetAttachment(c.Request().Context(), sha, name)
	if err != nil {
		return err
	}
	defer utils.CleanupWithErr(&err, attachementStream.Close, "failed to close attachment reader")

	mimeType, err := guessMimeType(name, attachementStream)
	if err != nil {
		return fmt.Errorf("failed to guess mime type: %w", err)
	}

	return c.Stream(200, mimeType, attachementStream)
}

// Get subtitle
//
// Get a specific subtitle.
//
// Path: /:path/subtitle/:name
func (h *Handler) GetSubtitle(c echo.Context) (err error) {
	_, sha, err := GetPath(c)
	if err != nil {
		return err
	}
	name := c.Param("name")
	if err := SanitizePath(name); err != nil {
		return err
	}

	subtitleStream, err := h.metadata.GetSubtitle(c.Request().Context(), sha, name)
	if err != nil {
		return err
	}
	defer utils.CleanupWithErr(&err, subtitleStream.Close, "failed to close subtitle reader")

	mimeType, err := guessMimeType(name, subtitleStream)
	if err != nil {
		return fmt.Errorf("failed to guess mime type: %w", err)
	}

	// Default the mime type to text/plain if it is not recognized
	if mimeType == "" {
		mimeType = "text/plain"
	}

	return c.Stream(200, mimeType, subtitleStream)
}

// Get thumbnail sprite
//
// Get a sprite file containing all the thumbnails of the show.
//
// Path: /:path/thumbnails.png
func (h *Handler) GetThumbnails(c echo.Context) (err error) {
	path, sha, err := GetPath(c)
	if err != nil {
		return err
	}

	sprite, err := h.metadata.GetThumbSprite(c.Request().Context(), path, sha)
	if err != nil {
		return err
	}
	defer utils.CleanupWithErr(&err, sprite.Close, "failed to close thumbnail sprite reader")

	return c.Stream(200, "image/png", sprite)
}

// Get thumbnail vtt
//
// Get a vtt file containing timing/position of thumbnails inside the sprite file.
// https://developer.bitmovin.com/playback/docs/webvtt-based-thumbnails for more info.
//
// Path: /:path/:resource/:slug/thumbnails.vtt
func (h *Handler) GetThumbnailsVtt(c echo.Context) (err error) {
	path, sha, err := GetPath(c)
	if err != nil {
		return err
	}

	vtt, err := h.metadata.GetThumbVtt(c.Request().Context(), path, sha)
	if err != nil {
		return err
	}
	defer utils.CleanupWithErr(&err, vtt.Close, "failed to close thumbnail vtt reader")

	return c.Stream(200, "text/vtt", vtt)
}

type Handler struct {
	transcoder *src.Transcoder
	metadata   *src.MetadataService
}

// Try to guess the mime type of a file based on its extension.
// If the extension is not recognized, return an empty string.
// If path is provided, it should contain a file extension (i.e. ".mp4").
// If content is provided, it should be of type io.ReadSeeker. Instances of other types are ignored.
// This implementation is based upon http.ServeContent.
func guessMimeType(path string, content any) (string, error) {
	// This does not match a large number of different types that are likely in use.
	// TODO add telemetry to see what file extensions are used, then add logic
	// to detect the type based on the file extension.
	mimeType := ""

	// First check the file extension, if there is one.
	ext := filepath.Ext(path)
	if ext != "" {
		if mimeType = mime.TypeByExtension(ext); mimeType != "" {
			return mimeType, nil
		}
	}

	// Try reading the first few bytes of the file to guess the mime type.
	// Only do this if seeking is supported
	if reader, ok := content.(io.ReadSeeker); ok {
		// 512 bytes is the most that DetectContentType will consider, so no
		// need to read more than that.
		var buf [512]byte
		n, _ := io.ReadFull(reader, buf[:])
		mimeType = http.DetectContentType(buf[:n])

		// Reset the reader to the beginning of the file
		_, err := reader.Seek(0, io.SeekStart)
		if err != nil {
			return "", fmt.Errorf("mime type guesser failed to seek to beginning of file: %w", err)
		}
	}

	return mimeType, nil
}

func main() {
	e := echo.New()

	if err := run(e); err != nil {
		e.Logger.Fatal(err)
	}
}

func run(e *echo.Echo) (err error) {
	e.Use(middleware.Logger())
	e.HTTPErrorHandler = ErrorHandler

	metadata, err := src.NewMetadataService()
	if err != nil {
		return fmt.Errorf("failed to create metadata service: %w", err)
	}
	defer utils.CleanupWithErr(&err, metadata.Close, "failed to close metadata service")

	transcoder, err := src.NewTranscoder(metadata)
	if err != nil {
		return fmt.Errorf("failed to create transcoder: %w", err)
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

	api.RegisterPProfHandlers(e)

	if err := e.Start(":7666"); err != nil {
		return fmt.Errorf("failed to start server: %w", err)
	}
	return nil
}
