package main

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"net/http"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgerrcode"
	"github.com/jackc/pgx/v5"
	"github.com/labstack/echo/v4"
	"github.com/zoriya/kyoo/keibi/dbc"
)

type ApiKey struct {
	Name string `json:"name" example:"myapp"`
	CreatedAt time.Time `json:"createAt" example:"2025-03-29T18:20:05.267Z"`
	LastUsed time.Time `json:"lastUsed" example:"2025-03-29T18:20:05.267Z"`
	Claims jwt.MapClaims `json:"claims" example:"isAdmin: true"`
}

type ApiKeyWToken struct {
	ApiKey
	Token string `json:"token" example:"myapp-lyHzTYm9yi+pkEv3m2tamAeeK7Dj7N3QRP7xv7dPU5q9MAe8tU4ySwYczE0RaMr4fijsA=="`
}

type ApiKeyDto struct {
	Name string `json:"name" example:"my-app" validate:"alpha"`
	Claims jwt.MapClaims `json:"claims" example:"isAdmin: true"`
}

func MapDbKey(key *dbc.Apikey) ApiKeyWToken {
	return ApiKeyWToken{
		ApiKey: ApiKey{
			Name: key.Name,
			Claims: key.Claims,
			CreatedAt: key.CreatedAt,
			LastUsed: key.LastUsed,
		},
		Token: key.Token,
	}
}

// @Summary      Create API key
// @Description  Create a new API key
// @Tags         apikeys
// @Accept       json
// @Produce      json
// @Security     Jwt[apikeys.write]
// @Param        key  body      ApiKeyDto  false  "Api key info"
// @Success      201  {object}  ApiKeyWToken
// @Failure      409  {object}  KError "Duplicated api key"
// @Failure      422  {object}  KError "Invalid create body"
// @Router       /keys [post]
func (h *Handler) CreateApiKey(c echo.Context) error {
	var req ApiKeyDto
	err := c.Bind(&req)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnprocessableEntity, err.Error())
	}
	if err = c.Validate(&req); err != nil {
		return err
	}

	id := make([]byte, 64)
	_, err = rand.Read(id)
	if err != nil {
		return err
	}

	dbkey, err := h.db.CreateApiKey(context.Background(), dbc.CreateApiKeyParams{
		Name: req.Name,
		Token: fmt.Sprintf("%s-%s", req.Name, base64.RawURLEncoding.EncodeToString(id)),
		Claims: req.Claims,
	})
	if ErrIs(err, pgerrcode.UniqueViolation) {
		return echo.NewHTTPError(409, "An apikey with the same name already exists.")
	} else if err != nil {
		return err
	}
	return c.JSON(201, MapDbKey(&dbkey))
}

// @Summary      Delete API key
// @Description  Delete an existing API key
// @Tags         apikeys
// @Accept       json
// @Produce      json
// @Security     Jwt[apikeys.write]
// @Success      200  {object}  ApiKey
// @Failure      404  {object}  KError "Invalid id"
// @Failure      422  {object}  KError "Invalid id format"
// @Router       /keys [delete]
func (h *Handler) DeleteApiKey(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(422, "Invalid id given: not an uuid")
	}

	dbkey, err := h.db.DeleteApiKey(context.Background(), id)
	if err == pgx.ErrNoRows {
		return echo.NewHTTPError(404, "No apikey found")
	} else if err != nil {
		return err
	}
	return c.JSON(200, MapDbKey(&dbkey).ApiKey)
}

// @Summary      List API keys
// @Description  List all api keys
// @Tags         apikeys
// @Accept       json
// @Produce      json
// @Security     Jwt[apikeys.read]
// @Success      200  {object}  Page[ApiKey]
// @Router       /keys [get]
func (h *Handler) ListApiKey(c echo.Context) error {
	dbkeys, err := h.db.ListApiKeys(context.Background())
	if err != nil {
		return err
	}
	var ret []ApiKey
	for _, key := range dbkeys {
		ret = append(ret, MapDbKey(&key).ApiKey)
	}
	return c.JSON(200, Page[ApiKey]{
		Items: ret,
		This: c.Request().URL.String(),
	})
}
