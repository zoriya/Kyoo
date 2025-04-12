package main

import (
	"net/http"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/labstack/echo/v4"
)

type ApiKey struct {
	Name string `json:"name" example:"my-app"`
	Token string `json:"token" example:"lyHzTYm9yi+pkEv3m2tamAeeK7Dj7N3QRP7xv7dPU5q9MAe8tU4ySwYczE0RaMr4fijsA=="`
	CreatedAt time.Time `json:"createAt" example:"2025-03-29T18:20:05.267Z"`
	LastUsed time.Time `json:"lastUsed" example:"2025-03-29T18:20:05.267Z"`
	Claims jwt.MapClaims `json:"claims" example:"isAdmin: true"`
}

type ApiKeyDto struct {
	Name string `json:"name" example:"my-app" validate:"alpha"`
	Claims jwt.MapClaims `json:"claims" example:"isAdmin: true"`
}

// @Summary      Create API key
// @Description  Create a new API key
// @Tags         apikeys
// @Accept       json
// @Produce      json
// @Security     Jwt[apikeys.write]
// @Param        key  body      ApiKeyDto  false  "Api key info"
// @Success      201  {object}  ApiKey
// @Failure      409  {object}  KError "Duplicated api key"
// @Failure      422  {object}  KError "Invalid create body"
// @Router       /users [get]
func (h *Handler) CreateApiKey(c echo.Context) error {
	var req ApiKeyDto
	err := c.Bind(&req)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnprocessableEntity, err.Error())
	}
	if err = c.Validate(&req); err != nil {
		return err
	}
}
