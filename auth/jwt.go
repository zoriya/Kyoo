package main

import (
	"context"
	"crypto/x509"
	"encoding/pem"
	"maps"
	"net/http"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/labstack/echo/v4"
)

type Jwt struct {
	// The jwt token you can use for all authorized call to either keibi or other services.
	Token string `json:"token"`
}

type Info struct {
	// The public key used to sign jwt tokens. It can be used by your services to check if the jwt is valid.
	PublicKey string `json:"publicKey"`
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
	claims["sub"] = session.User.Id.String()
	claims["sid"] = session.Id.String()
	claims["iss"] = h.config.Issuer
	claims["exp"] = &jwt.NumericDate{
		Time: time.Now().UTC().Add(time.Hour),
	}
	claims["iss"] = &jwt.NumericDate{
		Time: time.Now().UTC(),
	}
	jwt := jwt.NewWithClaims(jwt.SigningMethodRS256, claims)
	t, err := jwt.SignedString(h.config.JwtPrivateKey)
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, Jwt{
		Token: t,
	})
}

// @Summary      Info
// @Description  Get info like the public key used to sign the jwts.
// @Tags         jwt
// @Produce      json
// @Success      200  {object}  Info
// @Router /info [get]
func (h *Handler) GetInfo(c echo.Context) error {
	key := pem.EncodeToMemory(
		&pem.Block{
			Type:  "RSA PUBLIC KEY",
			Bytes: x509.MarshalPKCS1PublicKey(h.config.JwtPublicKey),
		},
	)

	return c.JSON(200, Info{
		PublicKey: string(key),
	})
}
