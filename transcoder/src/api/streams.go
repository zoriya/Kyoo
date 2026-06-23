package api

import (
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/golang-jwt/jwt/v5"
	"github.com/labstack/echo/v5"
	"github.com/zoriya/kyoo/transcoder/src"
)

type shandler struct {
	transcoder *src.Transcoder
}

func RegisterStreamHandlers(e *echo.Group, transcoder *src.Transcoder) {
	h := shandler{transcoder}

	e.GET("/streams", h.GetStreams)
	e.GET("/:path/direct", DirectStream)
	e.GET("/:path/direct/:identifier", DirectStream)
	e.GET("/:path/master.m3u8", h.GetMaster)
	e.GET("/:path/:video/:quality/index.m3u8", h.GetVideoIndex)
	e.GET("/:path/audio/:audio/:quality/index.m3u8", h.GetAudioIndex)
	e.GET("/:path/:video/:quality/:chunk", h.GetVideoSegment)
	e.GET("/:path/audio/:audio/:quality/:chunk", h.GetAudioSegment)
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
func DirectStream(c *echo.Context) error {
	path, _, err := getPath(c)
	if err != nil {
		return err
	}
	return c.File(strings.TrimLeft(path, "/"))
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
func (h *shandler) GetMaster(c *echo.Context) error {
	client, err := getClientId(c)
	if err != nil {
		return err
	}
	profileId, sessionId := getIdentity(c)
	path, sha, err := getPath(c)
	if err != nil {
		return err
	}

	ret, err := h.transcoder.GetMaster(c.Request().Context(), path, client, profileId, sessionId, sha)
	if err != nil {
		return err
	}
	c.Response().Header().Set("Content-Type", "application/vnd.apple.mpegurl")
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
func (h *shandler) GetVideoIndex(c *echo.Context) error {
	video, err := strconv.ParseInt(c.Param("video"), 10, 32)
	if err != nil {
		return err
	}
	quality, err := src.VideoQualityFromString(c.Param("quality"))
	if err != nil {
		return err
	}
	client, err := getClientId(c)
	if err != nil {
		return err
	}
	profileId, sessionId := getIdentity(c)
	path, sha, err := getPath(c)
	if err != nil {
		return err
	}

	ret, err := h.transcoder.GetVideoIndex(
		c.Request().Context(),
		path,
		uint32(video),
		quality,
		client,
		profileId,
		sessionId,
		sha,
	)
	if err != nil {
		return err
	}
	c.Response().Header().Set("Content-Type", "application/vnd.apple.mpegurl")
	return c.String(http.StatusOK, ret)
}

// Transcode audio
//
// Get the selected audio
// This route can take a few seconds to respond since it will way for at least one segment to be
// available.
//
// Path: /:path/audio/:audio/:quality/index.m3u8
//
// PRIVATE ROUTE (not documented in swagger, can change at any time)
// Only reached via the master.m3u8.
func (h *shandler) GetAudioIndex(c *echo.Context) error {
	audio, err := strconv.ParseInt(c.Param("audio"), 10, 32)
	if err != nil {
		return err
	}
	quality, err := src.AudioQualityFromString(c.Param("quality"))
	if err != nil {
		return err
	}
	client, err := getClientId(c)
	if err != nil {
		return err
	}
	profileId, sessionId := getIdentity(c)
	path, sha, err := getPath(c)
	if err != nil {
		return err
	}

	ret, err := h.transcoder.GetAudioIndex(
		c.Request().Context(),
		path,
		uint32(audio),
		quality,
		client,
		profileId,
		sessionId,
		sha,
	)
	if err != nil {
		return err
	}
	c.Response().Header().Set("Content-Type", "application/vnd.apple.mpegurl")
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
func (h *shandler) GetVideoSegment(c *echo.Context) error {
	video, err := strconv.ParseInt(c.Param("video"), 10, 32)
	if err != nil {
		return err
	}
	quality, err := src.VideoQualityFromString(c.Param("quality"))
	if err != nil {
		return err
	}
	path, sha, err := getPath(c)
	if err != nil {
		return err
	}

	if c.Param("chunk") == InitSegmentName {
		ret, err := h.transcoder.GetVideoInit(c.Request().Context(), path, uint32(video), quality, sha)
		if err != nil {
			return err
		}
		return serveSegment(c, ret)
	}

	segment, err := parseSegment(c.Param("chunk"))
	if err != nil {
		return err
	}
	client, err := getClientId(c)
	if err != nil {
		return err
	}
	profileId, sessionId := getIdentity(c)

	ret, err := h.transcoder.GetVideoSegment(
		c.Request().Context(),
		path,
		uint32(video),
		quality,
		segment,
		client,
		profileId,
		sessionId,
		sha,
	)
	if err != nil {
		return segmentError(err)
	}
	return serveSegment(c, ret)
}

// Get audio chunk
//
// Retrieve a chunk of a transcoded audio.
//
// Path: /:path/audio/:audio/:quality/segments-:chunk.ts
//
// PRIVATE ROUTE (not documented in swagger, can change at any time)
// Only reached via the master.m3u8.
func (h *shandler) GetAudioSegment(c *echo.Context) error {
	audio, err := strconv.ParseInt(c.Param("audio"), 10, 32)
	if err != nil {
		return err
	}
	quality, err := src.AudioQualityFromString(c.Param("quality"))
	if err != nil {
		return err
	}
	path, sha, err := getPath(c)
	if err != nil {
		return err
	}

	if c.Param("chunk") == InitSegmentName {
		ret, err := h.transcoder.GetAudioInit(c.Request().Context(), path, uint32(audio), quality, sha)
		if err != nil {
			return err
		}
		return serveSegment(c, ret)
	}

	segment, err := parseSegment(c.Param("chunk"))
	if err != nil {
		return err
	}
	client, err := getClientId(c)
	if err != nil {
		return err
	}
	profileId, sessionId := getIdentity(c)

	ret, err := h.transcoder.GetAudioSegment(
		c.Request().Context(),
		path,
		uint32(audio),
		quality,
		segment,
		client,
		profileId,
		sessionId,
		sha,
	)
	if err != nil {
		return segmentError(err)
	}
	return serveSegment(c, ret)
}

// segmentError maps internal segment-retrieval errors to clean HTTP responses.
func segmentError(err error) error {
	if errors.Is(err, src.ErrSegmentOutOfRange) {
		return echo.NewHTTPError(http.StatusNotFound, "Requested segment does not exist.")
	}
	return err
}

func (h *shandler) GetStreams(c *echo.Context) error {
	return c.JSON(http.StatusOK, h.transcoder.ListRunningStreams())
}

func getClientId(c *echo.Context) (string, error) {
	key := c.QueryParam("clientId")
	if key == "" {
		key = c.Request().Header.Get("X-CLIENT-ID")
	}
	if key == "" {
		return "", echo.NewHTTPError(http.StatusBadRequest, "missing client id. Please specify the X-CLIENT-ID header (or the clientId query param) to a guid constant for the lifetime of the player (but unique per instance)")
	}
	return key, nil
}

func getIdentity(c *echo.Context) (*string, *string) {
	token, ok := c.Get("user").(*jwt.Token)
	if !ok || token == nil {
		return nil, nil
	}
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return nil, nil
	}

	profileId := normalizeOptionalId(claims["sub"])
	sessionId := normalizeOptionalId(claims["sid"])
	return profileId, sessionId
}

func normalizeOptionalId(value any) *string {
	id, ok := value.(string)
	if !ok || id == "" || id == "00000000-0000-0000-0000-000000000000" {
		return nil
	}
	return &id
}

// InitSegmentName is the filename of the shared fMP4 initialization segment
// referenced by #EXT-X-MAP in the media playlists.
const InitSegmentName = "init.mp4"

func parseSegment(segment string) (int32, error) {
	var ret int32
	_, err := fmt.Sscanf(segment, "segment-%d.mp4", &ret)
	if err != nil {
		return 0, echo.NewHTTPError(http.StatusBadRequest, "Could not parse segment.")
	}
	return ret, nil
}

// serveSegment serves an fMP4 init or media segment with the correct content type.
func serveSegment(c *echo.Context, path string) error {
	c.Response().Header().Set("Content-Type", "video/mp4")
	return c.File(strings.TrimLeft(path, "/"))
}
