package main

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"os"
	"strconv"

	"github.com/otaxhu/problem"
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
	} else {
		c.Logger().Error(err)
	}

	ret := problem.NewDefault(code)
	if message != "" {
		ret.Detail = message
	}
	c.JSON(code, ret)
}

type Validator struct {
	validator *validator.Validate
}

func (v *Validator) Validate(i interface{}) error {
	if err := v.validator.Struct(i); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	return nil
}

func (h *Handler) CheckHealth(c echo.Context) error {
	return c.JSON(200, struct{ Status string }{Status: "healthy"})
}

func OpenDatabase() (*pgxpool.Pool, error) {
	ctx := context.Background()

	port, err := strconv.ParseUint(os.Getenv("POSTGRES_PORT"), 10, 16)
	if err != nil {
		return nil, errors.New("invalid postgres port specified")
	}

	config, _ := pgxpool.ParseConfig("")
	config.ConnConfig.Host = os.Getenv("POSTGRES_SERVER")
	config.ConnConfig.Port = uint16(port)
	config.ConnConfig.Database = os.Getenv("POSTGRES_DB")
	config.ConnConfig.User = os.Getenv("POSTGRES_USER")
	config.ConnConfig.Password = os.Getenv("POSTGRES_PASSWORD")
	config.ConnConfig.TLSConfig = nil
	config.ConnConfig.RuntimeParams = map[string]string{
		"application_name": "keibi",
	}
	schema := os.Getenv("POSTGRES_SCHEMA")
	if schema == "" {
		schema = "keibi"
	}
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
		e.Logger.Fatal("Could not open databse: ", err)
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

	r := e.Group("")
	r.Use(echojwt.WithConfig(echojwt.Config{
		SigningMethod: "RS256",
		SigningKey:    h.config.JwtPublicKey,
	}))

	e.GET("/health", h.CheckHealth)

	r.GET("/users", h.ListUsers)
	r.GET("/users/:id", h.GetUser)
	r.GET("/users/me", h.GetMe)
	r.DELETE("/users/:id", h.DeleteUser)
	r.DELETE("/users/me", h.DeleteSelf)
	e.POST("/users", h.Register)

	e.POST("/sessions", h.Login)
	r.DELETE("/sessions", h.Logout)
	r.DELETE("/sessions/:id", h.Logout)

	e.GET("/jwt", h.CreateJwt)
	e.GET("/info", h.GetInfo)

	e.GET("/swagger/*", echoSwagger.WrapHandler)

	e.Logger.Fatal(e.Start(":4568"))
}
