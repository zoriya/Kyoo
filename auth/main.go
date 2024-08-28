package main

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"os"
	"strconv"

	"github.com/zoriya/kyoo/keibi/dbc"

	"github.com/go-playground/validator/v10"
	"github.com/golang-migrate/migrate/v4"
	pgxd "github.com/golang-migrate/migrate/v4/database/pgx/v5"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/jackc/pgx/v5/stdlib"
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

type Validator struct {
	validator *validator.Validate
}

func (v *Validator) Validate(i interface{}) error {
	if err := v.validator.Struct(i); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	return nil
}

func OpenDatabase() (*pgxpool.Pool, error) {
	ctx := context.Background()

	port, err := strconv.ParseUint(os.Getenv("POSTGRES_PORT"), 10, 16)
	if err != nil {
		return nil, errors.New("invalid postgres port specified")
	}
	conf := pgxpool.Config{
		ConnConfig: &pgx.ConnConfig{
			Config: pgconn.Config{
				Host:      os.Getenv("POSTGRES_SERVER"),
				Port:      uint16(port),
				Database:  os.Getenv("POSTGRES_DB"),
				User:      os.Getenv("POSTGRES_USER"),
				Password:  os.Getenv("POSTGRES_PASSWORD"),
				TLSConfig: nil,
				RuntimeParams: map[string]string{
					"application_name": "keibi",
				},
			},
		},
	}
	schema := os.Getenv("POSTGRES_SCHEMA")
	if schema == "" {
		schema = "keibi"
	}
	if schema != "disabled" {
		conf.ConnConfig.Config.RuntimeParams["search_path"] = schema
	}

	db, err := pgxpool.NewWithConfig(ctx, &conf)
	if err != nil {
		fmt.Printf("Could not connect to database, check your env variables!")
		return nil, err
	}
	defer db.Close()

	if schema != "disabled" {
		_, err = db.Exec(ctx, fmt.Sprintf("create schema if not exists %s", schema))
		if err != nil {
			return nil, err
		}
	}

	driver, err := pgxd.WithInstance(stdlib.OpenDBFromPool(db), &pgxd.Config{})
	if err != nil {
		return nil, err
	}
	m, err := migrate.NewWithDatabaseInstance("file://sql/migrations", "postgres", driver)
	if err != nil {
		return nil, err
	}
	m.Up()

	return db, nil
}

type Handler struct {
	db *dbc.Queries
	config *Configuration
}

func main() {
	e := echo.New()
	e.Use(middleware.Logger())
	e.Validator = &Validator{validator: validator.New(validator.WithRequiredStructEnabled())}
	e.HTTPErrorHandler = ErrorHandler

	db, err := OpenDatabase()
	if err != nil {
		e.Logger.Fatal(err)
		return
	}

	h := Handler{
		db: dbc.New(db),
	}
	conf, err := LoadConfiguration(h.db)
	if err != nil {
		e.Logger.Fatal("Could not load configuration: %v", err)
		return
	}
	h.config = conf

	e.GET("/users", h.ListUsers)
	e.POST("/users", h.Register)

	e.Logger.Fatal(e.Start(":4568"))
}
