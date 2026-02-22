package api

import (
	"fmt"
	"io"
	"mime"
	"net/http"
	"os"
	"path/filepath"

	"github.com/asticode/go-astisub"
	"github.com/labstack/echo/v4"
	"github.com/zoriya/kyoo/transcoder/src"
	"github.com/zoriya/kyoo/transcoder/src/utils"
)

type mhandler struct {
	metadata *src.MetadataService
}

func RegisterMetadataHandlers(e *echo.Group, metadata *src.MetadataService) {
	h := mhandler{metadata}

	e.GET("/:path/info", h.GetInfo)
	e.GET("/:path/subtitle/:name", h.GetSubtitle)
	e.GET("/:path/attachment/:name", h.GetAttachment)
	e.GET("/:path/thumbnails.png", h.GetThumbnails)
	e.GET("/:path/thumbnails.vtt", h.GetThumbnailsVtt)
}

// @Summary      Identify
//
// @Description  Identify metadata about a file.
//
// @Tags         metadata
// @Param        path  path   string    true  "Base64 of a video's path"  format(base64) example(L3ZpZGVvL2J1YmJsZS5ta3YK)
//
// @Success      200  {object}  src.MediaInfo   "Metadata info of the video."
// @Router       /:path/info [get]
func (h *mhandler) GetInfo(c echo.Context) error {
	path, sha, err := getPath(c)
	if err != nil {
		return err
	}

	ret, err := h.metadata.GetMetadata(c.Request().Context(), path, sha)
	// even if the file doesn't exist, give a stub.
	if err != nil {
		info, err := os.Stat(path)
		size := int64(0)
		if err == nil {
			size = info.Size()
		}
		return c.JSON(http.StatusOK, src.MediaInfo{
			Sha:       sha,
			Path:      path,
			Extension: filepath.Ext(path)[1:],
			Size:      size,
			Duration:  0,
			Container: nil,
			MimeCodec: nil,
			Versions: src.Versions{
				Info:      -1,
				Extract:   0,
				Thumbs:    0,
				Keyframes: 0,
			},
			Videos:    make([]src.Video, 0),
			Audios:    make([]src.Audio, 0),
			Subtitles: make([]src.Subtitle, 0),
			Chapters:  make([]src.Chapter, 0),
			Fonts:     make([]string, 0),
		})
	}
	return c.JSON(http.StatusOK, ret)
}

// @Summary      Get subtitle
//
// @Description  Get a specific subtitle.
//
// @Tags         metadata
// @Param        path  path   string    true  "Base64 of a video's path"  format(base64) example(L3ZpZGVvL2J1YmJsZS5ta3YK)
// @Param        name  path   string    true  "Name of the subtitle"  example(en.srt)
// @Param        format  query   string    false  "Output format to convert the subtitle into"  example(vtt)
//
// @Success      200  file  "Requested subtitle"
// @Router  /:path/subtitle/:name [get]
func (h *mhandler) GetSubtitle(c echo.Context) (err error) {
	path, sha, err := getPath(c)
	if err != nil {
		return err
	}
	name := c.Param("name")
	if err := sanitizePath(name); err != nil {
		return err
	}

	stream, err := h.metadata.GetSubtitle(c.Request().Context(), path, sha, name)
	if err != nil {
		return err
	}
	defer utils.CleanupWithErr(&err, stream.Close, "failed to close subtitle reader")

	outFmt := c.QueryParam("format")
	if outFmt == "" {
		mimeType, err := guessMimeType(name, stream)
		if err != nil {
			return fmt.Errorf("failed to guess mime type: %w", err)
		}

		// Default the mime type to text/plain if it is not recognized
		if mimeType == "" {
			mimeType = "text/plain"
		}
		return c.Stream(200, mimeType, stream)
	}

	pr, pw := io.Pipe()
	outExt := fmt.Sprintf(".%s", outFmt)
	err = src.ConvertSubtitle(
		filepath.Ext(name),
		stream,
		outExt,
		pw,
	)
	if err == astisub.ErrInvalidExtension {
		return echo.NewHTTPError(http.StatusBadRequest, "Input or output format not supported. Conversion failed.")
	} else if err != nil {
		return err
	}

	return c.Stream(200, mime.TypeByExtension(outExt), pr)
}

// @Summary      Get attachments
//
// @Description  Get a specific attachment.
//
// @Tags         metadata
// @Param        path  path   string    true  "Base64 of a video's path"  format(base64) example(L3ZpZGVvL2J1YmJsZS5ta3YK)
// @Param        name  path   string    true  "Name of the attachment"  example(font.ttf)
//
// @Success      200  file   "Requested attachment"
// @Router  /:path/attachment/:name [get]
func (h *mhandler) GetAttachment(c echo.Context) (err error) {
	_, sha, err := getPath(c)
	if err != nil {
		return err
	}
	name := c.Param("name")
	if err := sanitizePath(name); err != nil {
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

// @Summary      Get thumbnail sprite
//
// @Description  Get a sprite file containing all the thumbnails of the show.
//
// @Tags         metadata
// @Param        path  path   string    true  "Base64 of a video's path"  format(base64) example(L3ZpZGVvL2J1YmJsZS5ta3YK)
//
// @Success      200  file   "sprite"
// @Router  /:path/thumbnails.png [get]
func (h *mhandler) GetThumbnails(c echo.Context) (err error) {
	path, sha, err := getPath(c)
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

// @Summary      Get thumbnail vtt
//
// @Description  Get a vtt file containing timing/position of thumbnails inside the sprite file.
// @Description  https://developer.bitmovin.com/playback/docs/webvtt-based-thumbnails for more info.
//
// @Tags         metadata
// @Param        path  path   string    true  "Base64 of a video's path"  format(base64) example(L3ZpZGVvL2J1YmJsZS5ta3YK)
//
// @Success      200  file   "sprite"
// @Router   /:path/thumbnails.vtt [get]
func (h *mhandler) GetThumbnailsVtt(c echo.Context) (err error) {
	path, sha, err := getPath(c)
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
