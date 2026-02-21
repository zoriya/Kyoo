package main

import (
	"cmp"
	"crypto/rand"
	"encoding/base64"
	"net/http"
	"time"

	"github.com/alexedwards/argon2id"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/labstack/echo/v5"
	"github.com/zoriya/kyoo/keibi/dbc"
)

type Session struct {
	// Unique id of this session. Can be used for calls to DELETE
	Id uuid.UUID `json:"id" example:"e05089d6-9179-4b5b-a63e-94dd5fc2a397"`
	// When was the session first opened
	CreatedDate time.Time `json:"createdDate" example:"2025-03-29T18:20:05.267Z"`
	// Last date this session was used to access a service.
	LastUsed time.Time `json:"lastUsed" example:"2025-03-29T18:20:05.267Z"`
	// Device that created the session.
	Device *string `json:"device" example:"Web - Firefox"`
}

type SessionWToken struct {
	Session
	Token string `json:"token" example:"lyHzTYm9yi+pkEv3m2tamAeeK7Dj7N3QRP7xv7dPU5q9MAe8tU4ySwYczE0RaMr4fijsA=="`
}

func MapSession(ses *dbc.Session) Session {
	return Session{
		Id:          ses.Id,
		CreatedDate: ses.CreatedDate,
		LastUsed:    ses.LastUsed,
		Device:      ses.Device,
	}
}

func MapSessionToken(ses *dbc.Session) SessionWToken {
	return SessionWToken{
		Session: Session{
			Id:          ses.Id,
			CreatedDate: ses.CreatedDate,
			LastUsed:    ses.LastUsed,
			Device:      ses.Device,
		},
		Token: ses.Token,
	}
}

type LoginDto struct {
	// Either the email or the username.
	Login string `json:"login" validate:"required" example:"zoriya"`
	// Password of the account.
	Password string `json:"password" validate:"required" example:"password1234"`
}

// @Summary      Login
// @Description  Login to your account and open a session
// @Tags         sessions
// @Accept       json
// @Produce      json
// @Param        device  query   string    false  "The device the created session will be used on"  example(android tv)
// @Param        login   body    LoginDto  false  "Account informations"
// @Success      201  {object}   SessionWToken
// @Failure      403  {object}   KError "Invalid password"
// @Failure      404  {object}   KError "Account does not exists"
// @Failure      422  {object}   KError "User does not have a password (registered via oidc, please login via oidc)"
// @Router /sessions [post]
func (h *Handler) Login(c *echo.Context) error {
	ctx := c.Request().Context()
	var req LoginDto
	err := c.Bind(&req)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnprocessableEntity, err.Error())
	}
	if err = c.Validate(&req); err != nil {
		return err
	}

	dbuser, err := h.db.GetUserByLogin(ctx, req.Login)
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

func (h *Handler) createSession(c *echo.Context, user *User) error {
	ctx := c.Request().Context()

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
		Token:  base64.RawURLEncoding.EncodeToString(id),
		UserPk: user.Pk,
		Device: device,
	})
	if err != nil {
		return err
	}
	return c.JSON(201, MapSessionToken(&session))
}

// @Summary      Logout
// @Description  Delete a session and logout
// @Tags         sessions
// @Produce      json
// @Security     Jwt
// @Success      200  {object}  Session
// @Failure      401  {object}  KError "Missing jwt token"
// @Failure      403  {object}  KError "Invalid jwt token (or expired)"
// @Router /sessions/current [delete]
func (h *Handler) Logout(c *echo.Context) error {
	ctx := c.Request().Context()
	uid, err := GetCurrentUserId(c)
	if err != nil {
		return err
	}

	session := c.Param("id")
	if session == "current" {
		sid, ok := c.Get("user").(*jwt.Token).Claims.(jwt.MapClaims)["sid"]
		if !ok {
			return echo.NewHTTPError(http.StatusInternalServerError, "Missing session id")
		}
		session = sid.(string)
	}
	sid, err := uuid.Parse(session)
	if err != nil {
		return echo.NewHTTPError(422, "Invalid session id")
	}

	ret, err := h.db.DeleteSession(ctx, dbc.DeleteSessionParams{
		Id:     sid,
		UserId: uid,
	})
	if err == pgx.ErrNoRows {
		return echo.NewHTTPError(404, "Session not found with specified id")
	} else if err != nil {
		return err
	}
	return c.JSON(200, MapSession(&ret))
}

// @Summary      Delete other session
// @Description  Delete a session and logout
// @Tags         sessions
// @Produce      json
// @Security     Jwt
// @Param        id   path      string    true  "The id of the session to delete"  Format(uuid) Example(e05089d6-9179-4b5b-a63e-94dd5fc2a397)
// @Success      200  {object}  Session
// @Failure      404  {object}  KError "Session not found with specified id (if not using the /current route)"
// @Failure      422  {object}  KError "Invalid session id"
// @Router /sessions/{id} [delete]
func DocOnly() {}
