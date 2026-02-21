package main

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"maps"
	"net/http"
	"slices"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgerrcode"
	"github.com/jackc/pgx/v5"
	"github.com/labstack/echo/v5"
	"github.com/zoriya/kyoo/keibi/dbc"
)

type ApiKey struct {
	Id        uuid.UUID     `json:"id" example:"e05089d6-9179-4b5b-a63e-94dd5fc2a397"`
	Name      string        `json:"name" example:"myapp"`
	CreatedAt time.Time     `json:"createAt" example:"2025-03-29T18:20:05.267Z"`
	LastUsed  time.Time     `json:"lastUsed" example:"2025-03-29T18:20:05.267Z"`
	Claims    jwt.MapClaims `json:"claims" example:"isAdmin: true"`
}

type ApiKeyWToken struct {
	ApiKey
	Token string `json:"token" example:"myapp-lyHzTYm9yi+pkEv3m2tamAeeK7Dj7N3QRP7xv7dPU5q9MAe8tU4ySwYczE0RaMr4fijsA=="`
}

type ApiKeyDto struct {
	Name   string        `json:"name" example:"myapp" validate:"alpha"`
	Claims jwt.MapClaims `json:"claims" example:"isAdmin: true"`
}

func MapDbKey(key *dbc.Apikey) ApiKeyWToken {
	return ApiKeyWToken{
		ApiKey: ApiKey{
			Id:        key.Id,
			Name:      key.Name,
			Claims:    key.Claims,
			CreatedAt: key.CreatedAt,
			LastUsed:  key.LastUsed,
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
func (h *Handler) CreateApiKey(c *echo.Context) error {
	ctx := c.Request().Context()
	err := CheckPermissions(c, []string{"apikeys.write"})
	if err != nil {
		return err
	}

	var req ApiKeyDto
	err = c.Bind(&req)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnprocessableEntity, err.Error())
	}
	if err = c.Validate(&req); err != nil {
		return err
	}

	conflict := slices.ContainsFunc(h.config.EnvApiKeys, func(k ApiKeyWToken) bool {
		return k.Name == req.Name
	})
	if conflict {
		return echo.NewHTTPError(409, "An env apikey is already defined with the same name")
	}

	id := make([]byte, 64)
	_, err = rand.Read(id)
	if err != nil {
		return err
	}

	var user *int32
	uid, err := GetCurrentUserId(c)
	// if err, we probably are using an api key (so no user)
	if err != nil {
		u, _ := h.db.GetUser(ctx, dbc.GetUserParams{
			UseId: true,
			Id:    uid,
		})
		user = &u[0].User.Pk
	}

	dbkey, err := h.db.CreateApiKey(ctx, dbc.CreateApiKeyParams{
		Name:      req.Name,
		Token:     base64.RawURLEncoding.EncodeToString(id),
		Claims:    req.Claims,
		CreatedBy: user,
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
func (h *Handler) DeleteApiKey(c *echo.Context) error {
	ctx := c.Request().Context()
	err := CheckPermissions(c, []string{"apikeys.write"})
	if err != nil {
		return err
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(422, "Invalid id given: not an uuid")
	}

	dbkey, err := h.db.DeleteApiKey(ctx, id)
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
func (h *Handler) ListApiKey(c *echo.Context) error {
	ctx := c.Request().Context()
	err := CheckPermissions(c, []string{"apikeys.read"})
	if err != nil {
		return err
	}

	dbkeys, err := h.db.ListApiKeys(ctx)
	if err != nil {
		return err
	}
	var ret []ApiKey
	for _, key := range dbkeys {
		ret = append(ret, MapDbKey(&key).ApiKey)
	}

	for _, key := range h.config.EnvApiKeys {
		ret = append(ret, key.ApiKey)
	}

	return c.JSON(200, Page[ApiKey]{
		Items: ret,
		This:  c.Request().URL.String(),
	})
}

func (h *Handler) createApiJwt(ctx context.Context, apikey string) (string, error) {
	var key *ApiKeyWToken
	for _, k := range h.config.EnvApiKeys {
		if k.Token == apikey {
			key = &k
			break
		}
	}
	if key == nil {
		dbKey, err := h.db.GetApiKey(ctx, apikey)
		if err == pgx.ErrNoRows {
			return "", echo.NewHTTPError(http.StatusForbidden, "Invalid api key")
		} else if err != nil {
			return "", err
		}

		go func() {
			h.db.TouchApiKey(ctx, dbKey.Pk)
		}()

		found := MapDbKey(&dbKey)
		key = &found
	}

	claims := maps.Clone(key.Claims)
	claims["username"] = key.Name
	claims["sub"] = key.Id
	claims["sid"] = key.Id
	claims["iss"] = h.config.PublicUrl
	claims["iat"] = &jwt.NumericDate{
		Time: time.Now().UTC(),
	}
	claims["exp"] = &jwt.NumericDate{
		Time: time.Now().UTC().Add(time.Hour),
	}
	jwt := jwt.NewWithClaims(jwt.SigningMethodRS256, claims)
	jwt.Header["kid"] = h.config.JwtKid
	t, err := jwt.SignedString(h.config.JwtPrivateKey)
	if err != nil {
		return "", err
	}
	return t, nil
}
