package main

import (
	"context"
	"encoding/base64"
	"fmt"
	"maps"
	"net/http"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/labstack/echo/v5"
	"github.com/lestrrat-go/jwx/v3/jwk"
)

type Jwt struct {
	// The jwt token you can use for all authorized call to either keibi or other services.
	Token *string `json:"token" example:"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.KMUFsIDTnFmyG3nMiGM6H9FNFUROf3wh7SmqJp-QV30"`
}

// @Summary      Get JWT
// @Description  Convert a session token or an API key to a short lived JWT. Passing an existing JWT will refresh it.
// @Tags         jwt
// @Produce      json
// @Security     Token
// @Success      200  {object}  Jwt
// @Failure      403  {object}  KError "Invalid session token (or expired)"
// @Header       200  {string}  Authorization  "Jwt (same value as the returned token)"
// @Router /jwt [get]
func (h *Handler) CreateJwt(c *echo.Context) error {
	ctx := c.Request().Context()
	queryApikey, queryToken := getQueryAuth(c)

	apikey := c.Request().Header.Get("X-Api-Key")
	if apikey == "" {
		apikey = queryApikey
	}
	if apikey != "" {
		token, err := h.createApiJwt(ctx, apikey)
		if err != nil {
			return err
		}
		c.Response().Header().Add("Authorization", fmt.Sprintf("Bearer %s", token))
		return c.JSON(http.StatusOK, Jwt{
			Token: &token,
		})
	}

	auth := c.Request().Header.Get("Authorization")
	var token string

	if auth == "" {
		protocol, ok := c.Request().Header["Sec-Websocket-Protocol"]
		if ok &&
			len(protocol) == 2 &&
			protocol[0] == "kyoo" &&
			strings.HasPrefix(protocol[1], "Bearer ") {
			token = protocol[1][len("Bearer "):]
		} else if cookie, _ := c.Request().Cookie("X-Bearer"); cookie != nil {
			token = cookie.Value
		} else {
			token = queryToken
		}
	} else if strings.HasPrefix(auth, "Bearer ") {
		token = auth[len("Bearer "):]
	} else if auth != "" {
		return echo.NewHTTPError(http.StatusUnauthorized, "Invalid bearer format.")
	}

	var jwt *string
	if token == "" {
		jwt = h.createGuestJwt()
		if jwt == nil {
			return echo.NewHTTPError(http.StatusUnauthorized, "Guests not allowed.")
		}
	} else if _, err := base64.RawURLEncoding.DecodeString(token); err != nil {
		tkn, err := h.refreshJwt(ctx, token)
		if err != nil {
			return err
		}
		jwt = &tkn
	} else {
		tkn, err := h.createJwt(ctx, token)
		if err != nil {
			return err
		}
		jwt = &tkn
	}

	if jwt != nil {
		c.Response().Header().Add("Authorization", fmt.Sprintf("Bearer %s", *jwt))
	}
	return c.JSON(http.StatusOK, Jwt{
		Token: jwt,
	})
}

func (h *Handler) createGuestJwt() *string {
	if h.config.GuestClaims == nil {
		return nil
	}

	claims := maps.Clone(h.config.GuestClaims)
	claims["username"] = "guest"
	claims["sub"] = "00000000-0000-0000-0000-000000000000"
	claims["sid"] = "00000000-0000-0000-0000-000000000000"
	claims["jti"] = uuid.New().String()
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
		return nil
	}
	return &t
}

func (h *Handler) createJwt(ctx context.Context, token string) (string, error) {
	session, err := h.db.GetUserFromToken(ctx, token)
	if err != nil {
		return "", echo.NewHTTPError(http.StatusForbidden, "Invalid token")
	}
	if session.LastUsed.Add(h.config.ExpirationDelay).Compare(time.Now().UTC()) < 0 {
		return "", echo.NewHTTPError(http.StatusForbidden, "Token has expired")
	}

	go func() {
		h.db.TouchSession(ctx, session.Pk)
		h.db.TouchUser(ctx, session.User.Pk)
	}()

	claims := maps.Clone(session.User.Claims)
	claims["username"] = session.User.Username
	claims["sub"] = session.User.Id.String()
	claims["sid"] = session.Id.String()
	claims["jti"] = uuid.New().String()
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

func (h *Handler) refreshJwt(ctx context.Context, jwtToken string) (string, error) {
	token, err := jwt.ParseWithClaims(jwtToken, jwt.MapClaims{}, func(t *jwt.Token) (any, error) {
		if t.Method.Alg() != "RS256" {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return h.config.JwtPublicKey, nil
	})
	if err != nil {
		return "", echo.NewHTTPError(http.StatusForbidden, "Invalid JWT")
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return "", echo.NewHTTPError(http.StatusForbidden, "Invalid JWT claims")
	}

	sidStr, ok := claims["sid"].(string)
	if !ok {
		return "", echo.NewHTTPError(http.StatusForbidden, "Missing session id in JWT")
	}
	sid, err := uuid.Parse(sidStr)
	if err != nil {
		return "", echo.NewHTTPError(http.StatusForbidden, "Invalid session id in JWT")
	}

	jtiStr, ok := claims["jti"].(string)
	if !ok {
		return "", echo.NewHTTPError(http.StatusForbidden, "Missing token id in JWT")
	}
	jti, err := uuid.Parse(jtiStr)
	if err != nil {
		return "", echo.NewHTTPError(http.StatusForbidden, "Invalid token id in JWT")
	}

	var newClaims jwt.MapClaims

	if sid.String() != "00000000-0000-0000-0000-000000000000" {
		session, err := h.db.GetUserFromSessionId(ctx, sid)
		if err != nil {
			return "", echo.NewHTTPError(http.StatusForbidden, "Session not found")
		}

		if session.LastUsed.Add(h.config.ExpirationDelay).Compare(time.Now().UTC()) < 0 {
			return "", echo.NewHTTPError(http.StatusForbidden, "Session has expired")
		}

		go func() {
			h.db.TouchSession(ctx, session.Pk)
			h.db.TouchUser(ctx, session.User.Pk)
		}()

		newClaims = maps.Clone(session.User.Claims)
		newClaims["username"] = session.User.Username
		newClaims["sub"] = session.User.Id.String()
		newClaims["sid"] = session.Id.String()
	} else {
		newClaims = maps.Clone(h.config.GuestClaims)
		newClaims["username"] = "guest"
		newClaims["sub"] = "00000000-0000-0000-0000-000000000000"
		newClaims["sid"] = "00000000-0000-0000-0000-000000000000"
	}

	newClaims["jti"] = jti.String()
	newClaims["iss"] = h.config.PublicUrl
	newClaims["iat"] = &jwt.NumericDate{
		Time: time.Now().UTC(),
	}
	newClaims["exp"] = &jwt.NumericDate{
		Time: time.Now().UTC().Add(time.Hour),
	}
	newJwt := jwt.NewWithClaims(jwt.SigningMethodRS256, newClaims)
	newJwt.Header["kid"] = h.config.JwtKid
	t, err := newJwt.SignedString(h.config.JwtPrivateKey)
	if err != nil {
		return "", err
	}
	return t, nil
}

// only used for the swagger doc
type JwkSet struct {
	Keys []struct {
		E      string   `json:"e" example:"AQAB"`
		KeyOps []string `json:"key_ops" example:"[verify]"`
		Kty    string   `json:"kty" example:"RSA"`
		N      string   `json:"n" example:"oBcXcJUR-Sb8_b4qIj28LRAPxdF_6odRr52K5-ymiEkR2DOlEuXBtM-biWxPESW-U-zhfHzdVLf6ioy5xL0bJTh8BMIorkrDliN3vb81jCvyOMgZ7ATMJpMAQMmSDN7sL3U45r22FaoQufCJMQHmUsZPecdQSgj2aFBiRXxsLleYlSezdBVT_gKH-coqeYXSC_hk-ezSq4aDZ10BlDnZ-FA7-ES3T7nBmJEAU7KDAGeSvbYAfYimOW0r-Vc0xQNuwGCfzZtSexKXDbYbNwOVo3SjfCabq-gMfap_owcHbKicGBZu1LDlh7CpkmLQf_kv6GihM2LWFFh6Vwg2cltiwF22EIPlUDtYTkUR0qRkdNJaNkwV5Vv_6r3pzSmu5ovRriKtlrvJMjlTnLb4_ltsge3fw5Z34cJrsp094FbUc2O6Or4FGEXUldieJCnVRhs2_h6SDcmeMXs1zfvE5GlDnq8tZV6WMJ5Sb4jNO7rs_hTkr23_E6mVg-DdtRS256ozGfqzRzhIjPym6D_jVfR6dZv5W0sKwOHRmT7nYq-C7b2sAwmNNII296M4Rq-jn0b5pgSeMDYbIpbIA4thU8LYU0lBZp_ZVwWKG1RFZDxz3k9O5UVth2kTpTWlwn0hB1aAvgXHo6in1CScITGA72p73RbDieNnLFaCK4xUVstkWAKLqPxs"`
		Use    string   `json:"use" example:"sig"`
	}
}

// @Summary      Jwks
// @Description  Get the jwks info, used to validate jwts.
// @Tags         jwt
// @Produce      json
// @Success      200  {object}  JwkSet  "OK"
// @Router /.well-known/jwks.json [get]
func (h *Handler) GetJwks(c *echo.Context) error {
	key, err := jwk.Import(h.config.JwtPublicKey)
	if err != nil {
		return err
	}

	key.Set("use", "sig")
	key.Set("key_ops", "verify")
	key.Set("kid", h.config.JwtKid)
	set := jwk.NewSet()
	set.AddKey(key)
	return c.JSON(200, set)
}

func (h *Handler) GetOidcConfig(c *echo.Context) error {
	return c.JSON(200, struct {
		JwksUri string `json:"jwks_uri"`
	}{
		JwksUri: fmt.Sprintf("%s/.well-known/jwks.json", h.config.PublicUrl),
	})
}
