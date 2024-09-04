package main

import (
	"fmt"
	"slices"
	"strings"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

func GetCurrentUserId(c echo.Context) (uuid.UUID, error) {
	user := c.Get("user").(*jwt.Token)
	if user == nil {
		return uuid.UUID{}, echo.NewHTTPError(401, "Unauthorized")
	}
	sub, err := user.Claims.GetSubject()
	if err != nil {
		return uuid.UUID{}, echo.NewHTTPError(403, "Could not retrive subject")
	}
	ret, err := uuid.Parse(sub)
	if err != nil {
		return uuid.UUID{}, echo.NewHTTPError(403, "Invalid id")
	}
	return ret, nil
}

func CheckPermissions(c echo.Context, perms []string) error {
	token, ok := c.Get("user").(*jwt.Token)
	if !ok {
		return echo.NewHTTPError(401, "Not logged in")
	}
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return echo.NewHTTPError(403, "Could not retrieve claims")
	}

	permissions_claims, ok := claims["permissions"]
	if !ok {
		return echo.NewHTTPError(403, fmt.Sprintf("Missing permissions: %s.", ", "))
	}
	permissions, ok := permissions_claims.([]string)
	if !ok {
		return echo.NewHTTPError(403, "Invalid permission claim.")
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
