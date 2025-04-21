package main

import (
	"context"
	"encoding/base64"
	"errors"
	"fmt"
	"net/http"
	"os"
	"strconv"
	"strings"

	"github.com/zoriya/kyoo/keibi/dbc"
	_ "github.com/zoriya/kyoo/keibi/docs"

	"github.com/go-playground/validator/v10"
	"github.com/golang-migrate/migrate/v4"
	pgxd "github.com/golang-migrate/migrate/v4/database/pgx/v5"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/jackc/pgx/v5/stdlib"
	"github.com/labstack/echo-jwt/v4"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"github.com/swaggo/echo-swagger"
)

func ErrorHandler(err error, c echo.Context) {
	code := http.StatusInternalServerError
	var message string

	if he, ok := err.(*echo.HTTPError); ok {
		code = he.Code
		message = fmt.Sprint(he.Message)

		if message == "missing or malformed jwt" {
			code = http.StatusUnauthorized
		}
	} else {
		c.Logger().Error(err)
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

func (h *Handler) CheckHealth(c echo.Context) error {
	return c.JSON(200, struct{ Status string }{Status: "healthy"})
}

func GetenvOr(env string, def string) string {
	out := os.Getenv(env)
	if out == "" {
		return def
	}
	return out
}

func OpenDatabase() (*pgxpool.Pool, error) {
	ctx := context.Background()

	port, err := strconv.ParseUint(GetenvOr("POSTGRES_PORT", "5432"), 10, 16)
	if err != nil {
		return nil, errors.New("invalid postgres port specified")
	}

	config, _ := pgxpool.ParseConfig("")
	config.ConnConfig.Host = GetenvOr("POSTGRES_SERVER", "postgres")
	config.ConnConfig.Port = uint16(port)
	config.ConnConfig.Database = GetenvOr("POSTGRES_DB", "kyoo")
	config.ConnConfig.User = GetenvOr("POSTGRES_USER", "kyoo")
	config.ConnConfig.Password = GetenvOr("POSTGRES_PASSWORD", "password")
	config.ConnConfig.TLSConfig = nil
	config.ConnConfig.RuntimeParams = map[string]string{
		"application_name": "keibi",
	}
	schema := GetenvOr("POSTGRES_SCHEMA", "keibi")
	if schema != "disabled" {
		config.ConnConfig.RuntimeParams["search_path"] = schema
	}

	db, err := pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		fmt.Printf("Could not connect to database, check your env variables!")
		return nil, err
	}

	if schema != "disabled" {
		_, err = db.Exec(ctx, fmt.Sprintf("create schema if not exists %s", schema))
		if err != nil {
			return nil, err
		}
	}

	fmt.Println("Migrating database")
	dbi := stdlib.OpenDBFromPool(db)
	defer dbi.Close()

	driver, err := pgxd.WithInstance(dbi, &pgxd.Config{})
	if err != nil {
		return nil, err
	}
	m, err := migrate.NewWithDatabaseInstance("file://sql/migrations", "postgres", driver)
	if err != nil {
		return nil, err
	}
	m.Up()
	fmt.Println("Migrating finished")

	return db, nil
}

type Handler struct {
	db     *dbc.Queries
	config *Configuration
}

func (h *Handler) TokenToJwt(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		var jwt *string

		apikey := c.Request().Header.Get("X-Api-Key")
		if apikey != "" {
			token, err := h.createApiJwt(apikey)
			if err != nil {
				return err
			}
			jwt = &token
		} else {
			auth := c.Request().Header.Get("Authorization")

			if auth == "" || !strings.HasPrefix(auth, "Bearer ") {
				jwt = h.createGuestJwt()
			} else {
				token := auth[len("Bearer "):]
				// this is only used to check if it is a session token or a jwt
				_, err := base64.RawURLEncoding.DecodeString(token)
				if err != nil {
					return next(c)
				}

				tkn, err := h.createJwt(token)
				if err != nil {
					return err
				}
				jwt = &tkn
			}
		}

		if jwt != nil {
			c.Request().Header.Set("Authorization", *jwt)
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
	e := echo.New()
	e.Use(middleware.Logger())
	e.Validator = &Validator{validator: validator.New(validator.WithRequiredStructEnabled())}
	e.HTTPErrorHandler = ErrorHandler

	db, err := OpenDatabase()
	if err != nil {
		e.Logger.Fatal("Could not open database: ", err)
		return
	}

	h := Handler{
		db: dbc.New(db),
	}
	conf, err := LoadConfiguration(h.db)
	if err != nil {
		e.Logger.Fatal("Could not load configuration: ", err)
		return
	}
	h.config = conf

	g := e.Group(conf.Prefix)
	r := e.Group(conf.Prefix)
	r.Use(h.TokenToJwt)
	r.Use(echojwt.WithConfig(echojwt.Config{
		SigningMethod: "RS256",
		SigningKey:    h.config.JwtPublicKey,
	}))

	g.GET("/health", h.CheckHealth)

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
	r.DELETE("/keys", h.DeleteApiKey)

	g.GET("/jwt", h.CreateJwt)
	e.GET("/.well-known/jwks.json", h.GetJwks)
	e.GET("/.well-known/openid-configuration", h.GetOidcConfig)

	g.GET("/swagger/*", echoSwagger.WrapHandler)

	e.Logger.Fatal(e.Start(":4568"))
}
