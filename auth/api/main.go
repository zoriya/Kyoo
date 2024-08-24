package main

import (
	"database/sql"
	"fmt"
	"net/http"
	"net/url"
	"os"

	"github.com/zoriya/kyoo/keibi/dbc"

	"github.com/golang-migrate/migrate"
	"github.com/golang-migrate/migrate/database/postgres"
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

func OpenDatabase() (*sql.DB, error) {
	con := fmt.Sprintf(
		"postgresql://%v:%v@%v:%v/%v?application_name=gocoder&sslmode=disable",
		url.QueryEscape(os.Getenv("POSTGRES_USER")),
		url.QueryEscape(os.Getenv("POSTGRES_PASSWORD")),
		url.QueryEscape(os.Getenv("POSTGRES_SERVER")),
		url.QueryEscape(os.Getenv("POSTGRES_PORT")),
		url.QueryEscape(os.Getenv("POSTGRES_DB")),
	)
	schema := os.Getenv("POSTGRES_SCHEMA")
	if schema == "" {
		schema = "keibi"
	}
	if schema != "disabled" {
		con = fmt.Sprintf("%s&search_path=%s", con, url.QueryEscape(schema))
	}
	db, err := sql.Open("postgres", con)
	if err != nil {
		fmt.Printf("Could not connect to database, check your env variables!")
		return nil, err
	}

	if schema != "disabled" {
		_, err = db.Exec(fmt.Sprintf("create schema if not exists %s", schema))
		if err != nil {
			return nil, err
		}
	}

	driver, err := postgres.WithInstance(db, &postgres.Config{})
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
}

func main() {
	e := echo.New()
	e.Use(middleware.Logger())
	e.HTTPErrorHandler = ErrorHandler

	db, err := OpenDatabase();
	if err != nil {
		e.Logger.Fatal(err)
		return
	}

	h := Handler{
		db: dbc.New(db),
	}

	e.GET("/users", h.ListUsers)

	e.Logger.Fatal(e.Start(":4568"))
}
