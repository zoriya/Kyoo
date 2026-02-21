package main

import (
	"errors"
	"fmt"
	"slices"
	"strings"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/labstack/echo/v5"
)

func GetCurrentUserId(c *echo.Context) (uuid.UUID, error) {
	user := c.Get("user").(*jwt.Token)
	if user == nil {
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
	user := c.Get("user").(*jwt.Token)
	if user == nil {
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
