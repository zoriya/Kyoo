package main

import (
	"context"
	"fmt"
	"io"
	"mime"
	"net/http"
	"path/filepath"
	"strconv"

	_ "github.com/zoriya/kyoo/transcoder/docs"

	"github.com/golang-jwt/jwt/v5"
	echoSwagger "github.com/swaggo/echo-swagger"
	"github.com/zoriya/kyoo/transcoder/src"
	"github.com/zoriya/kyoo/transcoder/src/api"
	"github.com/zoriya/kyoo/transcoder/src/utils"

	"github.com/lestrrat-go/httprc/v3"
	"github.com/lestrrat-go/jwx/v3/jwk"

	echojwt "github.com/labstack/echo-jwt/v4"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

func ErrorHandler(err error, c echo.Context) {
	code := http.StatusInternalServerError
	var message string
	if he, ok := err.(*echo.HTTPError); ok {
		code = he.Code
		message = fmt.Sprint(he.Message)
	} else {
		c.Logger().Error(err)
		message = "Internal server error"
	}
	c.JSON(code, struct {
		Errors []string `json:"errors"`
	}{Errors: []string{message}})
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

// @title gocoder - Kyoo's transcoder
// @version 1.0
// @description Real time transcoder.

// @contact.name Repository
// @contact.url https://github.com/zoriya/kyoo

// @license.name  GPL-3.0
// @license.url https://www.gnu.org/licenses/gpl-3.0.en.html

// @host kyoo.zoriya.dev
// @BasePath /video

// @securityDefinitions.apiKey Token
// @in header
// @name Authorization

// @securityDefinitions.apiKey Jwt
// @in header
// @name Authorization
func main() {
	e := echo.New()
	e.Use(middleware.Logger())
	e.GET("/video/swagger/*", echoSwagger.WrapHandler)
	e.HTTPErrorHandler = ErrorHandler

	metadata, err := src.NewMetadataService()
	if err != nil {
		e.Logger.Fatal("failed to create metadata service: ", err)
		return
	}
	defer utils.CleanupWithErr(&err, metadata.Close, "failed to close metadata service")

	transcoder, err := src.NewTranscoder(metadata)
	if err != nil {
		e.Logger.Fatal("failed to create transcoder: ", err)
		return
	}

	h := Handler{
		transcoder: transcoder,
		metadata:   metadata,
	}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	jwks, err := jwk.NewCache(ctx, httprc.NewClient())
	if err != nil {
		e.Logger.Fatal("failed to create jwk cache: ", err)
		return
	}
	jwks.Register(ctx, src.Settings.JwksUrl)

	g := e.Group("/video")
	g.Use(echojwt.WithConfig(echojwt.Config{
		KeyFunc: func(token *jwt.Token) (any, error) {
			return jwks.CachedSet(src.Settings.JwksUrl)
			// kid, ok := token.Header["kid"]
			// if !ok {
			// 	return nil, errors.New("missing kid in jwt")
			// }
			// keys, err := jwks.CachedSet(src.Settings.JwksUrl)
			// if err != nil {
			// 	return nil, err
			// }
			// return keys.LookupKeyID(kid.(string))
		},
	}))
	g.GET("/:path/info", h.GetInfo)
	g.GET("/:path/thumbnails.png", h.GetThumbnails)
	g.GET("/:path/thumbnails.vtt", h.GetThumbnailsVtt)
	g.GET("/:path/attachment/:name", h.GetAttachment)
	g.GET("/:path/subtitle/:name", h.GetSubtitle)

	api.RegisterStreamHandlers(g)
	api.RegisterPProfHandlers(e)

	e.Logger.Fatal(e.Start(":7666"))
}
