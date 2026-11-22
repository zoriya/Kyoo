package api

import (
	"errors"
	"fmt"
	"net/http"
	"os"
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

	e.GET("/streams", h.GetStreams, RequirePermission("users.read"))
	e.GET("/:path/direct", DirectStream)
	e.GET("/:path/direct/:identifier", DirectStream)
	e.GET("/:path/download/:quality", h.GetDownload)
	e.HEAD("/:path/download/:quality", h.HeadDownload)
	e.GET("/:path/download/:quality/status", h.GetDownloadStatus)
	e.DELETE("/:path/download/:quality", h.CancelDownload)
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

func getDownloadParams(c *echo.Context, needId bool) (string, string, src.VideoQuality, string, error) {
	quality, err := src.VideoQualityFromString(c.Param("quality"))
	if err != nil {
		return "", "", "", "", err
	}
	path, sha, err := getPath(c)
	if err != nil {
		return "", "", "", "", err
	}
	id := c.QueryParam("id")
	if (needId && id == "") || len(id) > 128 {
		return "", "", "", "", echo.NewHTTPError(http.StatusBadRequest, "Missing or invalid download id.")
	}
	return path, sha, quality, id, nil
}

// @Summary      Download
//
// @Description  Download an mkv of the video for offline use, with the default video track in the selected quality,
// @Description  every audio tracks, every subtitles (external ones included) and fonts.
// @Description  The file is prepared on the first request, until it's ready this returns a 202 with the progress:
// @Description  request the same url again after `Retry-After`.
// @Description  A failure is reported (with a 500), use a new id to retry.
// @Description  The prepared file can change (if the server restarts for example), use the `ETag` with `If-Range` to resume.
//
// @Tags         streams
// @Param        path  path   string    true  "Base64 of a video's path"  format(base64) example(L3ZpZGVvL2J1YmJsZS5ta3YK)
// @Param        quality  path   string    true  "Quality of the video"  example(720p)
// @Param        id  query   string    true  "Random id identifying this client's download, use the same one until it's done."
//
// @Success      206  file   "Video file"
// @Success      202  {object}  src.DownloadInfo  "The file is being prepared"
// @Failure      500  {object}  src.DownloadInfo  "The preparation failed"
// @Router /:path/download/:quality [get]
func (h *shandler) GetDownload(c *echo.Context) error {
	path, sha, quality, id, err := getDownloadParams(c, true)
	if err != nil {
		return err
	}
	dl, err := h.transcoder.StartDownload(c.Request().Context(), path, sha, quality, id)
	if err != nil {
		return err
	}
	return serveDownload(c, dl, sha, quality)
}

// @Summary      Download headers
//
// @Description  Same responses as the download route (without a body) but it never starts a preparation.
// @Description  Use the status route to get the json.
//
// @Tags         streams
// @Param        path  path   string    true  "Base64 of a video's path"  format(base64) example(L3ZpZGVvL2J1YmJsZS5ta3YK)
// @Param        quality  path   string    true  "Quality of the video"  example(720p)
//
// @Success      206  "The file is ready (with its size, etag...)"
// @Success      202  "The file is being prepared"
// @Failure      404  "Not started (or cancelled)"
// @Failure      500  "The preparation failed"
// @Router /:path/download/:quality [head]
func (h *shandler) HeadDownload(c *echo.Context) error {
	_, sha, quality, _, err := getDownloadParams(c, false)
	if err != nil {
		return err
	}
	dl := h.transcoder.GetDownload(sha, quality)
	if dl == nil {
		return echo.NewHTTPError(http.StatusNotFound, "Download not started.")
	}
	return serveDownload(c, dl, sha, quality)
}

func serveDownload(c *echo.Context, dl *src.Download, sha string, quality src.VideoQuality) error {
	info := dl.Info()
	switch info.Status {
	case src.DownloadCancelled:
		return echo.NewHTTPError(http.StatusNotFound, "Download not started.")
	case src.DownloadReady:
		stat, err := os.Stat(dl.Path)
		if err != nil {
			return err
		}
		c.Response().Header().Set("ETag", fmt.Sprintf(`"%s-%s-%x"`, sha, quality, stat.ModTime().UnixNano()))
		return c.Attachment(strings.TrimLeft(dl.Path, "/"), dl.Name)
	case src.DownloadFailed:
		return c.JSON(http.StatusInternalServerError, info)
	default:
		c.Response().Header().Set("Retry-After", strconv.Itoa(info.RetryAfter))
		return c.JSON(http.StatusAccepted, info)
	}
}

// @Summary      Download status
//
// @Description  Get the status of the download of this video in this quality
//
// @Tags         streams
// @Param        path  path   string    true  "Base64 of a video's path"  format(base64) example(L3ZpZGVvL2J1YmJsZS5ta3YK)
// @Param        quality  path   string    true  "Quality of the video"  example(720p)
//
// @Success      200  {object}  src.DownloadInfo  "Status of the download"
// @Failure      404  "Never started (or forgotten since)"
// @Router /:path/download/:quality/status [get]
func (h *shandler) GetDownloadStatus(c *echo.Context) error {
	_, sha, quality, _, err := getDownloadParams(c, false)
	if err != nil {
		return err
	}
	dl := h.transcoder.GetDownload(sha, quality)
	if dl == nil {
		return echo.NewHTTPError(http.StatusNotFound, "Download never started.")
	}
	return c.JSON(http.StatusOK, dl.Info())
}

// @Summary      Cancel download
//
// @Description  The preparation is stopped (or the prepared file deleted)
// @Description  Call it once the file is downloaded too so the server can delete it.
//
// @Tags         streams
// @Param        path  path   string    true  "Base64 of a video's path"  format(base64) example(L3ZpZGVvL2J1YmJsZS5ta3YK)
// @Param        quality  path   string    true  "Quality of the video"  example(720p)
// @Param        id  query   string    true  "Id used to download"
//
// @Success      204  "Download cancelled"
// @Router /:path/download/:quality [delete]
func (h *shandler) CancelDownload(c *echo.Context) error {
	_, sha, quality, id, err := getDownloadParams(c, true)
	if err != nil {
		return err
	}
	h.transcoder.CancelDownload(sha, quality, id)
	return c.NoContent(http.StatusNoContent)
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

	ret, err := h.transcoder.GetMaster(c.Request().Context(), path, client, getQuery(c, client), profileId, sessionId, sha)
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
		getQuery(c, client),
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
		getQuery(c, client),
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
		ret, err := h.transcoder.GetVideoInit(
			c.Request().Context(),
			path,
			uint32(video),
			quality,
			sha,
		)
		if err != nil {
			return err
		}
		return c.File(strings.TrimLeft(ret, "/"))
	}

	segment, err := parseSegment(c.Param("chunk"))
	if err != nil {
		return err
	}
	profileId, sessionId := getIdentity(c)
	client, err := getClientId(c)
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
		profileId,
		sessionId,
		sha,
	)
	if err != nil {
		return segmentError(err)
	}
	return c.File(strings.TrimLeft(ret, "/"))
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
		ret, err := h.transcoder.GetAudioInit(
			c.Request().Context(),
			path,
			uint32(audio),
			quality,
			sha,
		)
		if err != nil {
			return err
		}
		return c.File(strings.TrimLeft(ret, "/"))
	}

	segment, err := parseSegment(c.Param("chunk"))
	if err != nil {
		return err
	}
	profileId, sessionId := getIdentity(c)
	client, err := getClientId(c)
	if err != nil {
		return err
	}

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
	return c.File(strings.TrimLeft(ret, "/"))
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

func getQuery(c *echo.Context, client string) string {
	query := c.Request().URL.Query()
	query.Set("clientId", client)
	return query.Encode()
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

const InitSegmentName = "init.mp4"

func parseSegment(segment string) (int32, error) {
	var ret int32
	_, err := fmt.Sscanf(segment, "segment-%d.mp4", &ret)
	if err != nil {
		return 0, echo.NewHTTPError(http.StatusBadRequest, "Could not parse segment.")
	}
	return ret, nil
}
