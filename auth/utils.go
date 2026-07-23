package main

import (
	"errors"
	"fmt"
	"net/url"
	"slices"
	"strings"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/labstack/echo/v5"
)

// getQueryAuth extracts credentials passed as query parameters: an api key
// (`apikey`) or a session/bearer token (`token`). This lets videos and images be
// authenticated from third-party browser contexts (e.g. <img>/<video> tags or
// the chromecast receiver) that can't set an Authorization/X-Api-Key header nor
// a cookie.
//
// When keibi is reached through traefik's forward-auth middleware, the original
// request's query string is not present on the /auth/jwt request itself but is
// forwarded in the X-Forwarded-Uri header, so we read it from there too.
func getQueryAuth(c *echo.Context) (apikey string, token string) {
	query := c.Request().URL.Query()
	apikey = query.Get("apikey")
	token = query.Get("session-token")

	if apikey != "" || token != "" {
		return apikey, token
	}

	if fwd := c.Request().Header.Get("X-Forwarded-Uri"); fwd != "" {
		if u, err := url.Parse(fwd); err == nil {
			fq := u.Query()
			apikey = fq.Get("apikey")
			token = fq.Get("session-token")
		}
	}
	return apikey, token
}

func GetCurrentUserId(c *echo.Context) (uuid.UUID, error) {
	user, ok := c.Get("user").(*jwt.Token)
	if !ok || user == nil {
		return uuid.UUID{}, echo.NewHTTPError(401, "Unauthorized")
	}
	sub, err := user.Claims.GetSubject()
	if err != nil {
		return uuid.UUID{}, echo.NewHTTPError(403, "Could not retrieve subject")
	}
	ret, err := uuid.Parse(sub)
	if err != nil {
		return uuid.UUID{}, echo.NewHTTPError(403, "Invalid id")
	}
	return ret, nil
}

func GetCurrentSessionId(c *echo.Context) (uuid.UUID, error) {
	user, ok := c.Get("user").(*jwt.Token)
	if !ok || user == nil {
		return uuid.UUID{}, echo.NewHTTPError(401, "Unauthorized")
	}
	claims, ok := user.Claims.(jwt.MapClaims)
	if !ok {
		return uuid.UUID{}, echo.NewHTTPError(403, "Could not retrieve claims")
	}
	sid, ok := claims["sid"]
	if !ok {
		return uuid.UUID{}, echo.NewHTTPError(403, "Could not retrieve session")
	}

	sid_str, ok := sid.(string)
	if !ok {
		return uuid.UUID{}, echo.NewHTTPError(403, "Invalid session id claim.")
	}

	ret, err := uuid.Parse(sid_str)
	if err != nil {
		return uuid.UUID{}, echo.NewHTTPError(403, "Invalid id")
	}
	return ret, nil
}

func CheckPermissions(c *echo.Context, perms []string) error {
	token, ok := c.Get("user").(*jwt.Token)
	if !ok {
		return echo.NewHTTPError(401, "Not logged in")
	}
	sub, err := token.Claims.GetSubject()
	// ignore guests
	if err != nil || sub == "00000000-0000-0000-0000-000000000000" {
		return echo.NewHTTPError(401, "Not logged in")
	}
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return echo.NewHTTPError(403, "Could not retrieve claims")
	}

	permissions_claims, ok := claims["permissions"]
	if !ok {
		return echo.NewHTTPError(403, fmt.Sprintf("No permissions on this account. Needs permissions: %s.", strings.Join(perms, ", ")))
	}
	permissions_int, ok := permissions_claims.([]any)
	if !ok {
		return echo.NewHTTPError(403, "Invalid permission claim.")
	}

	permissions := make([]string, len(permissions_int))
	for i, perm := range permissions_int {
		permissions[i], ok = perm.(string)
		if !ok {
			return echo.NewHTTPError(403, "Invalid permission claim.")
		}
	}

	missing := make([]string, 0)
	for _, perm := range perms {
		if !slices.Contains(permissions, perm) {
			missing = append(missing, perm)
		}
	}

	if len(missing) != 0 {
		return echo.NewHTTPError(
			403,
			fmt.Sprintf("Missing permissions: %s.", strings.Join(missing, ", ")),
		)
	}
	return nil
}

func ErrIs(err error, code string) bool {
	var pgerr *pgconn.PgError

	if !errors.As(err, &pgerr) {
		return false
	}
	return pgerr.Code == code
}
