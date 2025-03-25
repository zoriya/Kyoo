package main

import (
	"context"
	"fmt"
	"maps"
	"net/http"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/labstack/echo/v4"
	"github.com/lestrrat-go/jwx/jwk"
)

type Jwt struct {
	// The jwt token you can use for all authorized call to either keibi or other services.
	Token string `json:"token"`
}

// @Summary      Get JWT
// @Description  Convert a session token to a short lived JWT.
// @Tags         jwt
// @Produce      json
// @Security     Token
// @Success      200  {object}  Jwt
// @Failure      401  {object}  problem.Problem "Missing session token"
// @Failure      403  {object}  problem.Problem "Invalid session token (or expired)"
// @Router /jwt [get]
func (h *Handler) CreateJwt(c echo.Context) error {
	auth := c.Request().Header.Get("Authorization")
	if !strings.HasPrefix(auth, "Bearer ") {
		return echo.NewHTTPError(http.StatusUnauthorized, "Missing session token")
	}
	token := auth[len("Bearer "):]

	session, err := h.db.GetUserFromToken(context.Background(), token)
	if err != nil {
		return echo.NewHTTPError(http.StatusForbidden, "Invalid token")
	}
	if session.LastUsed.Add(h.config.ExpirationDelay).Compare(time.Now().UTC()) < 0 {
		return echo.NewHTTPError(http.StatusForbidden, "Token has expired")
	}

	go func() {
		h.db.TouchSession(context.Background(), session.Id)
		h.db.TouchUser(context.Background(), session.User.Id)
	}()

	claims := maps.Clone(session.User.Claims)
	claims["username"] = session.User.Username
	claims["sub"] = session.User.Id.String()
	claims["sid"] = session.Id.String()
	claims["iss"] = h.config.PublicUrl
	claims["iat"] = &jwt.NumericDate{
		Time: time.Now().UTC(),
	}
	claims["exp"] = &jwt.NumericDate{
		Time: time.Now().UTC().Add(time.Hour),
	}
	jwt := jwt.NewWithClaims(jwt.SigningMethodRS256, claims)
	t, err := jwt.SignedString(h.config.JwtPrivateKey)
	if err != nil {
		return err
	}
	c.Response().Header().Add("Authorization", fmt.Sprintf("Bearer %s", t))
	return c.JSON(http.StatusOK, Jwt{
		Token: t,
	})
}

// @Summary      Jwks
// @Description  Get the jwks info, used to validate jwts.
// @Tags         jwt
// @Produce      json
// @Success      200  {object}  jwk.Key
// @Router /.well-known/jwks.json [get]
func (h *Handler) GetJwks(c echo.Context) error {
	key, err := jwk.New(h.config.JwtPublicKey)
	if err != nil {
		return err
	}

	key.Set("use", "sig")
	key.Set("key_ops", "verify")
	set := jwk.NewSet()
	set.Add(key)
	return c.JSON(200, set)
}

func (h *Handler) GetOidcConfig(c echo.Context) error {
	return c.JSON(200, struct {
		JwksUri string `json:"jwks_uri"`
	}{
		JwksUri: fmt.Sprintf("%s/.well-known/jwks.json", h.config.PublicUrl),
	})
}
