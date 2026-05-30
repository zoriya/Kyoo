package main

import (
	"net/http"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/labstack/echo/v5"
	"github.com/zoriya/kyoo/keibi/dbc"
)

type OidcTokenResponse struct {
	AccessToken  string  `json:"accessToken"`
	RefreshToken *string `json:"refreshToken"`
}

// @Summary      Get OIDC provider tokens
// @Description  Get stored OIDC access token for a provider.
// @Tags         oidc
// @Produce      json
// @Security     Jwt
// @Param        id        path  string  true  "User id" Format(uuid)
// @Param        provider  path  string  true  "OIDC provider id" Example(myanimelist)
// @Success      200  {object}  OidcTokenResponse
// @Failure      401  {object}  KError "Missing jwt token"
// @Failure      403  {object}  KError "Forbidden"
// @Failure      404  {object}  KError "No token found"
// @Router /users/{id}/oidc-tokens/{provider} [get]
func (h *Handler) GetOidcProviderToken(c *echo.Context) error {
	uid, err := GetCurrentUserId(c)
	if err != nil {
		return err
	}

	requested, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusUnprocessableEntity, "Invalid user id")
	}

	if requested != uid {
		if err := CheckPermissions(c, []string{"users.read"}); err != nil {
			return echo.NewHTTPError(http.StatusForbidden, "Forbidden")
		}
	}

	provider := strings.ToLower(c.Param("provider"))
	if provider == "" {
		return echo.NewHTTPError(http.StatusUnprocessableEntity, "Missing provider")
	}

	ctx := c.Request().Context()
	row, err := h.db.GetOidcHandleTokenByUserId(ctx, dbc.GetOidcHandleTokenByUserIdParams{
		Id:       requested,
		Provider: provider,
	})
	if err == pgx.ErrNoRows || row.AccessToken == nil || *row.AccessToken == "" {
		return echo.NewHTTPError(http.StatusNotFound, "No token found for this provider")
	}
	if err != nil {
		return err
	}

	return c.JSON(http.StatusOK, OidcTokenResponse{
		AccessToken:  *row.AccessToken,
		RefreshToken: row.RefreshToken,
	})
}
