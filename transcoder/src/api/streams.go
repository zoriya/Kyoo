package api

import (
	"fmt"
	"net/http"
	"strconv"

	"github.com/labstack/echo/v4"
	"github.com/zoriya/kyoo/transcoder/src"
)

type shandler struct {
	transcoder *src.Transcoder
}

func RegisterStreamHandlers(e *echo.Group, transcoder *src.Transcoder) {
	h := shandler{transcoder}

	e.GET("/:path/direct", DirectStream)
	e.GET("/:path/direct/:identifier", DirectStream)
	e.GET("/:path/master.m3u8", h.GetMaster)
	e.GET("/:path/:video/:quality/index.m3u8", h.GetVideoIndex)
	e.GET("/:path/audio/:audio/index.m3u8", h.GetAudioIndex)
	e.GET("/:path/:video/:quality/:chunk", h.GetVideoSegment)
	e.GET("/:path/audio/:audio/:chunk", h.GetAudioSegment)
}

// @Summary      Direct video
//
// @Description  Retrieve the raw video stream, in the same container as the one on the server.
// @Description  No transcoding or transmuxing is done.
//
// @Tags         streams
// @Param        path  path   string    true  "Base64 of a video's path"  format(base64) example(L3ZpZGVvL2J1YmJsZS5ta3YK)
// @Param        identifier  path   string    false  "anything, this can be used for the automatic file name when downloading from the browser"  example(bubble.mkv)
//
// @Success      206  file   "Video file (supports byte-requests)"
// @Router /:path/direct [get]
func DirectStream(c echo.Context) error {
	path, _, err := getPath(c)
	if err != nil {
		return err
	}
	return c.File(path)
}

// @Summary  Get master playlist
//
// @Description  Get a master playlist containing all possible video qualities and audios available for this resource.
// @Description  Note that the direct stream is missing (since the direct is not an hls stream) and
// @Description  subtitles/fonts are not included to support more codecs than just webvtt.
//
// @Tags         streams
// @Param        path  path   string    true  "Base64 of a video's path"  format(base64) example(L3ZpZGVvL2J1YmJsZS5ta3YK)
//
// @Success      200  file   "Master playlist with all available stream qualities"
// @Router  /:path/master.m3u8 [get]
func (h *shandler) GetMaster(c echo.Context) error {
	client, err := getClientId(c)
	if err != nil {
		return err
	}
	path, sha, err := getPath(c)
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
//
// PRIVATE ROUTE (not documented in swagger, can change at any time)
// Only reached via the master.m3u8.
func (h *shandler) GetVideoIndex(c echo.Context) error {
	video, err := strconv.ParseInt(c.Param("video"), 10, 32)
	if err != nil {
		return err
	}
	quality, err := src.QualityFromString(c.Param("quality"))
	if err != nil {
		return err
	}
	client, err := getClientId(c)
	if err != nil {
		return err
	}
	path, sha, err := getPath(c)
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
//
// PRIVATE ROUTE (not documented in swagger, can change at any time)
// Only reached via the master.m3u8.
func (h *shandler) GetAudioIndex(c echo.Context) error {
	audio, err := strconv.ParseInt(c.Param("audio"), 10, 32)
	if err != nil {
		return err
	}
	client, err := getClientId(c)
	if err != nil {
		return err
	}
	path, sha, err := getPath(c)
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
//
// PRIVATE ROUTE (not documented in swagger, can change at any time)
// Only reached via the master.m3u8.
func (h *shandler) GetVideoSegment(c echo.Context) error {
	video, err := strconv.ParseInt(c.Param("video"), 10, 32)
	if err != nil {
		return err
	}
	quality, err := src.QualityFromString(c.Param("quality"))
	if err != nil {
		return err
	}
	segment, err := parseSegment(c.Param("chunk"))
	if err != nil {
		return err
	}
	client, err := getClientId(c)
	if err != nil {
		return err
	}
	path, sha, err := getPath(c)
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
//
// PRIVATE ROUTE (not documented in swagger, can change at any time)
// Only reached via the master.m3u8.
func (h *shandler) GetAudioSegment(c echo.Context) error {
	audio, err := strconv.ParseInt(c.Param("audio"), 10, 32)
	if err != nil {
		return err
	}
	segment, err := parseSegment(c.Param("chunk"))
	if err != nil {
		return err
	}
	client, err := getClientId(c)
	if err != nil {
		return err
	}
	path, sha, err := getPath(c)
	if err != nil {
		return err
	}

	ret, err := h.transcoder.GetAudioSegment(c.Request().Context(), path, uint32(audio), segment, client, sha)
	if err != nil {
		return err
	}
	return c.File(ret)
}

func getClientId(c echo.Context) (string, error) {
	key := c.Request().Header.Get("X-CLIENT-ID")
	if key == "" {
		return "", echo.NewHTTPError(http.StatusBadRequest, "missing client id. Please specify the X-CLIENT-ID header to a guid constant for the lifetime of the player (but unique per instance)")
	}
	return key, nil
}

func parseSegment(segment string) (int32, error) {
	var ret int32
	_, err := fmt.Sscanf(segment, "segment-%d.ts", &ret)
	if err != nil {
		return 0, echo.NewHTTPError(http.StatusBadRequest, "Could not parse segment.")
	}
	return ret, nil
}
