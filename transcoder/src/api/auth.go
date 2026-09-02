package api

import (
	"fmt"
	"net/http"
	"slices"

	"github.com/golang-jwt/jwt/v5"
	"github.com/labstack/echo/v5"
	"github.com/zoriya/kyoo/transcoder/src"
)

func RequirePermission(permission string) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c *echo.Context) error {
			if src.Settings.JwksUrl == "" {
				return next(c)
			}

			user := c.Get("user")
			if user == nil {
				return echo.NewHTTPError(http.StatusForbidden, "missing jwt")
			}
			token, ok := user.(*jwt.Token)
			if !ok {
				return echo.NewHTTPError(http.StatusForbidden, "invalid jwt")
			}
			claims, ok := token.Claims.(jwt.MapClaims)
			if !ok {
				return echo.NewHTTPError(http.StatusForbidden, "invalid jwt claims")
			}
			permissions, ok := claims["permissions"]
			if !ok {
				return echo.NewHTTPError(http.StatusForbidden, "missing permissions claim")
			}
			perms, ok := permissions.([]any)
			if !ok {
				return echo.NewHTTPError(http.StatusForbidden, "permissions claim is not an array")
			}
			if !slices.Contains(perms, any(permission)) {
				return echo.NewHTTPError(http.StatusForbidden, fmt.Sprintf("missing %s permission", permission))
			}
			return next(c)
		}
	}
}
