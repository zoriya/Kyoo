package api

import (
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/labstack/echo/v5"
)

type health struct {
	db *pgxpool.Pool
}

func RegisterHealthHandlers(e *echo.Group, db *pgxpool.Pool) {
	h := health{db}
	e.GET("/health", h.CheckHealth)
	e.GET("/ready", h.CheckReady)
}

func (h *health) CheckHealth(c echo.Context) error {
	return c.JSON(200, struct {
		Status string `json:"status"`
	}{Status: "healthy"})
}

func (h *health) CheckReady(c echo.Context) error {
	_, err := h.db.Exec(c.Request().Context(), "select 1")

	status := "healthy"
	db := "healthy"
	ret := 200
	if err != nil {
		status = "unhealthy"
		ret = 500
		db = err.Error()
	}

	return c.JSON(ret, struct {
		Status   string `json:"status"`
		Database string `json:"database"`
	}{Status: status, Database: db})
}
