package main

import (
	"cmp"
	"context"
	"crypto/rand"
	"encoding/base64"
	"maps"
	"net/http"
	"strings"
	"time"

	"github.com/alexedwards/argon2id"
	"github.com/golang-jwt/jwt/v5"
	"github.com/labstack/echo/v4"
	"github.com/zoriya/kyoo/keibi/dbc"
)

type LoginDto struct {
	// Either the email or the username.
	Login string `json:"login" validate:"required"`
	// Password of the account.
	Password string `json:"password" validate:"required"`
}

// @Summary      Login
// @Description  Login to your account and open a session
// @Tags         sessions
// @Accept       json
// @Produce      json
// @Param        device  query   string    false  "The device the created session will be used on"
// @Param        login   body    LoginDto  false  "Account informations"
// @Success      201  {object}   dbc.Session
// @Failure      400  {object}   problem.Problem "Invalid login body"
// @Failure      403  {object}   problem.Problem "Invalid password"
// @Failure      404  {object}   problem.Problem "Account does not exists"
// @Failure      422  {object}   problem.Problem "User does not have a password (registered via oidc, please login via oidc)"
// @Router /sessions [post]
func (h *Handler) Login(c echo.Context) error {
	var req LoginDto
	err := c.Bind(&req)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	if err = c.Validate(&req); err != nil {
		return err
	}

	dbuser, err := h.db.GetUserByLogin(context.Background(), req.Login)
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "No account exists with the specified email or username.")
	}
	if dbuser.Password == nil {
		return echo.NewHTTPError(http.StatusUnprocessableEntity, "Can't login with password, this account was created with OIDC.")
	}

	match, err := argon2id.ComparePasswordAndHash(req.Password, *dbuser.Password)
	if err != nil {
		return err
	}
	if !match {
		return echo.NewHTTPError(http.StatusForbidden, "Invalid password")
	}

	user := MapDbUser(&dbuser)
	return h.createSession(c, &user)
}

func (h *Handler) createSession(c echo.Context, user *User) error {
	ctx := context.Background()

	id := make([]byte, 64)
	_, err := rand.Read(id)
	if err != nil {
		return err
	}

	dev := cmp.Or(c.Param("device"), c.Request().Header.Get("User-Agent"))
	device := &dev
	if dev == "" {
		device = nil
	}

	session, err := h.db.CreateSession(ctx, dbc.CreateSessionParams{
		Token:  base64.StdEncoding.EncodeToString(id),
		UserId: user.Id,
		Device: device,
	})
	if err != nil {
		return err
	}
	return c.JSON(201, session)
}

type Jwt struct {
	// The jwt token you can use for all authorized call to either keibi or other services.
	Token string `json:"token"`
}

// @Summary      Get JWT
// @Description  Convert a session token to a short lived JWT.
// @Tags         sessions
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
