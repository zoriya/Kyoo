package main

import (
	"context"
	"encoding/base64"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/user"
	"slices"
	"sort"
	"strings"
	"time"

	"github.com/zoriya/kyoo/keibi/dbc"
	_ "github.com/zoriya/kyoo/keibi/docs"

	"github.com/go-playground/validator/v10"
	"github.com/golang-migrate/migrate/v4"
	pgxd "github.com/golang-migrate/migrate/v4/database/pgx/v5"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/jackc/pgx/v5/stdlib"
	echojwt "github.com/labstack/echo-jwt/v5"
	"github.com/labstack/echo/v5"
	"github.com/labstack/echo/v5/middleware"
	echoSwagger "github.com/swaggo/echo-swagger"

	"github.com/exaring/otelpgx"
)

// otelecho & RequestLoggerWithConfig middleware call c.Error
// otelecho docs: https://pkg.go.dev/go.opentelemetry.io/contrib/instrumentation/github.com/labstack/echo/otelecho#WithOnError
func ErrorHandler(c *echo.Context, err error) {
	if resp, _ := echo.UnwrapResponse(c.Response()); resp != nil && resp.Committed {
		return
	}

	code := http.StatusInternalServerError
	var message string

	if he, ok := err.(*echo.HTTPError); ok {
		code = he.Code
		message = fmt.Sprint(he.Message)

		if message == "missing or malformed jwt" {
			code = http.StatusUnauthorized
		}
	} else {
		c.Logger().Error(err.Error())
	}

	c.JSON(code, KError{
		Status:  code,
		Message: message,
		Details: nil,
	})
}

type Validator struct {
	validator *validator.Validate
}

func (v *Validator) Validate(i any) error {
	if err := v.validator.Struct(i); err != nil {
		return echo.NewHTTPError(http.StatusUnprocessableEntity, err.Error())
	}
	return nil
}

func (h *Handler) CheckHealth(c *echo.Context) error {
	return c.JSON(200, struct {
		Status string `json:"status"`
	}{Status: "healthy"})
}

func (h *Handler) CheckReady(c *echo.Context) error {
	_, err := h.rawDb.Exec(c.Request().Context(), "select 1")

	status := "healthy"
	db := "healthy"
	ret := 200
	if err != nil {
		status = "unhealthy"
		db = err.Error()
		ret = 500
	}

	return c.JSON(ret, struct {
		Status   string `json:"status"`
		Database string `json:"database"`
	}{Status: status, Database: db})
}

func GetenvOr(env string, def string) string {
	out := os.Getenv(env)
	if out == "" {
		return def
	}
	return out
}

func OpenDatabase(ctx context.Context) (*pgxpool.Pool, error) {
	connectionString := GetenvOr("POSTGRES_URL", "")
	config, err := pgxpool.ParseConfig(connectionString)
	if err != nil {
		return nil, errors.New("failed to create postgres config from environment variables")
	}

	// Set default values
	if config.ConnConfig.Host == "/tmp" {
		config.ConnConfig.Host = "postgres"
	}
	if config.ConnConfig.Database == "" {
		config.ConnConfig.Database = "kyoo"
	}
	// The pgx library will set the username to the name of the current user if not provided via
	// environment variable or connection string. Make a best-effort attempt to see if the user
	// was explicitly specified, without implementing full connection string parsing. If not, set
	// the username to the default value of "kyoo".
	if os.Getenv("PGUSER") == "" {
		currentUserName, _ := user.Current()
		// If the username matches the current user and it's not in the connection string, then it was set
		// by the pgx library. This doesn't cover the case where the system username happens to be in some other part
		// of the connection string, but this cannot be checked without full connection string parsing.
		if currentUserName.Username == config.ConnConfig.User && !strings.Contains(connectionString, currentUserName.Username) {
			config.ConnConfig.User = "kyoo"
		}
	}
	if config.ConnConfig.Password == "" {
		config.ConnConfig.Password = "password"
	}
	if _, ok := config.ConnConfig.RuntimeParams["application_name"]; !ok {
		config.ConnConfig.RuntimeParams["application_name"] = "keibi"
	}

	config.ConnConfig.Tracer = otelpgx.NewTracer(
		otelpgx.WithSpanNameFunc(dbGetSpanName),
		otelpgx.WithDisableQuerySpanNamePrefix(),
		otelpgx.WithIncludeQueryParameters(),
	)

	db, err := pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		fmt.Printf("Could not connect to database, check your env variables!\n")
		return nil, err
	}

	slog.Info("Database migration state", "state", "starting")
	dbi := stdlib.OpenDBFromPool(db)
	defer dbi.Close()

	dbi.Exec("create schema if not exists keibi")
	driver, err := pgxd.WithInstance(dbi, &pgxd.Config{
		SchemaName: "keibi",
	})
	if err != nil {
		return nil, err
	}
	m, err := migrate.NewWithDatabaseInstance("file://sql/migrations", "postgres", driver)
	if err != nil {
		return nil, err
	}
	m.Up()
	slog.Info("Database migration state", "state", "completed")

	return db, nil
}

type Handler struct {
	db     *dbc.Queries
	rawDb  *pgxpool.Pool
	config *Configuration
}

func (h *Handler) TokenToJwt(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c *echo.Context) error {
		ctx := c.Request().Context()
		var jwt *string

		apikey := c.Request().Header.Get("X-Api-Key")
		if apikey != "" {
			token, err := h.createApiJwt(ctx, apikey)
			if err != nil {
				return err
			}
			jwt = &token
		} else {
			auth := c.Request().Header.Get("Authorization")

			if auth == "" || !strings.HasPrefix(auth, "Bearer ") {
				jwt = h.createGuestJwt()
				if jwt == nil {
					return echo.NewHTTPError(http.StatusUnauthorized, "Guests not allowed.")
				}
			} else {
				token := auth[len("Bearer "):]
				// this is only used to check if it is a session token or a jwt
				_, err := base64.RawURLEncoding.DecodeString(token)
				if err != nil {
					return next(c)
				}

				tkn, err := h.createJwt(ctx, token)
				if err != nil {
					return err
				}
				jwt = &tkn
			}
		}

		if jwt != nil {
			c.Request().Header.Set("Authorization", fmt.Sprintf("Bearer %s", *jwt))
		}
		return next(c)
	}
}

// @title Keibi - Kyoo's auth
// @version 1.0
// @description Auth system made for kyoo.

// @contact.name Repository
// @contact.url https://github.com/zoriya/kyoo

// @license.name  GPL-3.0
// @license.url https://www.gnu.org/licenses/gpl-3.0.en.html

// @host kyoo.zoriya.dev
// @BasePath /auth

// @securityDefinitions.apiKey Token
// @in header
// @name Authorization

// @securityDefinitions.apiKey Jwt
// @in header
// @name Authorization
func main() {
	ctx := context.Background()

	_, err := SetupLogger(ctx)
	if err != nil {
		slog.Error("logger init", "err", err)
	}

	cleanup, err := setupOtel(ctx)
	if err != nil {
		slog.Error("Failed to setup otel", "err", err)
		return
	}
	defer cleanup(ctx)

	e := echo.New()
	e.Logger = slog.Default()
	instrument(e)

	ignorepath := []string{
		"/.well-known/jwks.json",
		"/auth/health",
		"/auth/ready",
	}
	slog.Info("Skipping request logging for these paths", "paths", func() string { sort.Strings(ignorepath); return strings.Join(ignorepath, ",") }())

	// using example from https://echo.labstack.com/docs/middleware/logger#examples
	// full configs https://github.com/labstack/echo/blob/master/middleware/request_logger.go
	e.Use(middleware.RequestLoggerWithConfig(middleware.RequestLoggerConfig{
		// declare a small set of paths to ignore
		Skipper: func(c *echo.Context) bool {
			p := c.Request().URL.Path
			return slices.Contains(ignorepath, p)
		},
		LogStatus:    true,
		LogURI:       true,
		LogHost:      true,
		LogMethod:    true,
		LogUserAgent: true,
		HandleError:  true, // forwards error to the global error handler, so it can decide appropriate status code
		LogValuesFunc: func(c *echo.Context, v middleware.RequestLoggerValues) error {
			rCtx := c.Request().Context()
			if v.Error == nil {
				slog.LogAttrs(rCtx, slog.LevelInfo,
					fmt.Sprintf("%s %s%s %d", v.Method, v.Host, v.URI, v.Status),
					slog.String("method", v.Method),
					slog.Int("status", v.Status),
					slog.String("host", v.Host),
					slog.String("uri", v.URI),
					slog.String("agent", v.UserAgent),
				)
			} else {
				slog.LogAttrs(rCtx, slog.LevelError,
					fmt.Sprintf("%s %s%s %d err=%s",
						v.Method, v.Host, v.URI, v.Status, v.Error.Error()),
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

	e.Validator = &Validator{validator: validator.New(validator.WithRequiredStructEnabled())}
	e.HTTPErrorHandler = ErrorHandler

	db, err := OpenDatabase(ctx)
	if err != nil {
		e.Logger.Error("Could not open database: ", slog.Any("err", err))
		return
	}

	h := Handler{
		db:    dbc.New(db),
		rawDb: db,
	}
	conf, err := LoadConfiguration(ctx, h.db)
	if err != nil {
		e.Logger.Error("Could not load configuration: ", slog.Any("err", err))
		return
	}
	h.config = conf

	g := e.Group("/auth")
	r := e.Group("/auth")
	r.Use(h.TokenToJwt)
	r.Use(echojwt.WithConfig(echojwt.Config{
		SigningMethod: "RS256",
		SigningKey:    h.config.JwtPublicKey,
	}))

	g.GET("/health", h.CheckHealth)
	g.GET("/ready", h.CheckReady)

	r.GET("/users", h.ListUsers)
	r.GET("/users/:id", h.GetUser)
	r.GET("/users/me", h.GetMe)
	r.DELETE("/users/:id", h.DeleteUser)
	r.DELETE("/users/me", h.DeleteSelf)
	r.PATCH("/users/:id", h.EditUser)
	r.PATCH("/users/me", h.EditSelf)
	r.PATCH("/users/me/password", h.ChangePassword)
	g.POST("/users", h.Register)

	g.POST("/sessions", h.Login)
	r.DELETE("/sessions", h.Logout)
	r.DELETE("/sessions/:id", h.Logout)

	r.GET("/keys", h.ListApiKey)
	r.POST("/keys", h.CreateApiKey)
	r.DELETE("/keys/:id", h.DeleteApiKey)

	g.GET("/jwt", h.CreateJwt)
	g.Any("/jwt/*", h.CreateJwt)
	e.GET("/.well-known/jwks.json", h.GetJwks)
	e.GET("/.well-known/openid-configuration", h.GetOidcConfig)

	g.GET("/swagger/*", echoSwagger.WrapHandler)

	sc := echo.StartConfig{
		Address:         ":4568",
		GracefulTimeout: 10 * time.Second,
		HideBanner:      true,
	}
	if err := sc.Start(ctx, e); err != nil {
		e.Logger.Error("server failed", "err", err)
		os.Exit(1)
	}
}
