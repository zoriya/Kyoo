package main

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"slices"
	"sort"
	"strings"

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
	// otelecho & RequestLoggerWithConfig middleware call c.Error
	// otelecho docs: https://pkg.go.dev/go.opentelemetry.io/contrib/instrumentation/github.com/labstack/echo/otelecho#WithOnError
	if c.Response().Committed {
		return
	}

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

func RequireCorePlayPermission(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		user := c.Get("user")
		if user == nil {
			return echo.NewHTTPError(http.StatusForbidden, "missing jwt")
		}
		token, ok := user.(*jwt.Token)
		if !ok {
			return echo.NewHTTPError(http.StatusForbidden, "invalid jwt")
		}
		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			return echo.NewHTTPError(http.StatusForbidden, "invalid jwt claims")
		}
		permissions, ok := claims["permissions"]
		if !ok {
			return echo.NewHTTPError(http.StatusForbidden, "missing permissions claim")
		}
		perms, ok := permissions.([]any)
		if !ok {
			return echo.NewHTTPError(http.StatusForbidden, "permissions claim is not an array")
		}
		if !slices.Contains(perms, "core.play") {
			return echo.NewHTTPError(http.StatusForbidden, "missing core.play permission")
		}
		return next(c)
	}
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
	ctx := context.Background()

	logger, _, err := SetupLogger(ctx)
	if err != nil {
		slog.Error("logger init", "err", err)
	}

	cleanup, err := setupOtel(ctx)
	if err != nil {
		slog.Error("Failed to setup otel: ", "err", err)
		return
	}
	defer cleanup(ctx)

	e := echo.New()
	e.HideBanner = true
	e.Logger.SetOutput(logger)
	instrument(e)

	ignorepath := []string{
		"/video/health",
		"/video/ready",
	}
	slog.Info("Skipping request logging for these paths", "paths", func() string { sort.Strings(ignorepath); return strings.Join(ignorepath, ",") }())

	// using example from https://echo.labstack.com/docs/middleware/logger#examples
	// full configs https://github.com/labstack/echo/blob/master/middleware/request_logger.go
	e.Use(middleware.RequestLoggerWithConfig(middleware.RequestLoggerConfig{
		// declare a small set of paths to ignore
		Skipper: func(c echo.Context) bool {
			p := c.Request().URL.Path
			return slices.Contains(ignorepath, p)
		},
		LogStatus:    true,
		LogURI:       true,
		LogError:     true,
		LogHost:      true,
		LogMethod:    true,
		LogUserAgent: true,
		HandleError:  true, // forwards error to the global error handler, so it can decide appropriate status code
		LogValuesFunc: func(c echo.Context, v middleware.RequestLoggerValues) error {
			rCtx := c.Request().Context()
			if v.Error == nil {
				logger.LogAttrs(rCtx, slog.LevelInfo, "web_request",
					slog.String("method", v.Method),
					slog.Int("status", v.Status),
					slog.String("host", v.Host),
					slog.String("uri", v.URI),
					slog.String("agent", v.UserAgent),
				)
			} else {
				logger.LogAttrs(rCtx, slog.LevelError, "web_request_error",
					slog.String("method", v.Method),
					slog.Int("status", v.Status),
					slog.String("host", v.Host),
					slog.String("uri", v.URI),
					slog.String("agent", v.UserAgent),
					slog.String("err", v.Error.Error()),
				)
			}
			return nil
		},
	}))

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

	g := e.Group("/video")

	if src.Settings.JwksUrl != "" {
		ctx, cancel := context.WithCancel(context.Background())
		defer cancel()

		jwks, err := jwk.NewCache(ctx, httprc.NewClient())
		if err != nil {
			e.Logger.Fatal("failed to create jwk cache: ", err)
			return
		}
		jwks.Register(ctx, src.Settings.JwksUrl)
		g.Use(echojwt.WithConfig(echojwt.Config{
			KeyFunc: func(token *jwt.Token) (any, error) {
				keys, err := jwks.CachedSet(src.Settings.JwksUrl)
				if err != nil {
					return nil, err
				}
				kid, ok := token.Header["kid"].(string)
				if !ok {
					return nil, errors.New("missing kid in jwt")
				}
				key, found := keys.LookupKeyID(kid)
				if !found {
					return nil, fmt.Errorf("unable to find key %q", kid)
				}

				var pubkey any
				if err := jwk.Export(key, &pubkey); err != nil {
					return nil, fmt.Errorf("Unable to get the public key. Error: %s", err.Error())
				}

				return pubkey, nil
			},
		}))

		g.Use(RequireCorePlayPermission)
	}

	api.RegisterHealthHandlers(e.Group("/video"), metadata.Database)
	api.RegisterStreamHandlers(g, transcoder)
	api.RegisterMetadataHandlers(g, metadata)
	api.RegisterPProfHandlers(e)

	e.Logger.Fatal(e.Start(":7666"))
}
