package main

import (
	"cmp"
	"context"
	"crypto/rand"
	"encoding/base64"
	"math/big"
	"net/http"
	"strings"
	"unicode"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/labstack/echo/v5"
	"github.com/zoriya/kyoo/keibi/dbc"
	. "github.com/zoriya/kyoo/keibi/models"
)

type DeviceLogin struct {
	// Secret code the device uses to poll for its session. Never show it to the user.
	DeviceCode string `json:"deviceCode" example:"lyHzTYm9yi+pkEv3m2tamAeeK7Dj7N3QRP7xv7dPU5q9MAe8tU4ySwYczE0RaMr4fijsA"`
	// Code the user needs to input on an already logged in device.
	UserCode string `json:"userCode" example:"BCDFGHJK"`
	// Number of seconds before the codes expire.
	ExpiresIn int `json:"expiresIn" example:"600"`
	// Minimum number of seconds to wait between two polls.
	Interval int `json:"interval" example:"5"`
}

type DeviceCodeDto struct {
	// Secret code returned when the device login was created (POST /device).
	DeviceCode string `json:"deviceCode" validate:"required" example:"lyHzTYm9yi+pkEv3m2tamAeeK7Dj7N3QRP7xv7dPU5q9MAe8tU4ySwYczE0RaMr4fijsA"`
}

type DeviceApproveDto struct {
	// The user code displayed on the device.
	Code string `json:"code" validate:"required" example:"BCDFGHJK"`
}

type DeviceApproved struct {
	// Device that is now logged in.
	Device *string `json:"device" example:"Android - Android TV"`
}

// @Summary      Start device login
// @Description  Start a login for a device with limited input (like a TV). Display the userCode to the user
// @Description  and poll DELETE /device until a logged in user approves it via PATCH /device.
// @Tags         sessions
// @Produce      json
// @Param        device  query   string    false  "The device the created session will be used on"  example(android tv)
// @Success      201  {object}   DeviceLogin
// @Router /device [post]
func (h *Handler) StartDeviceLogin(c *echo.Context) error {
	ctx := c.Request().Context()

	deviceCode := make([]byte, 64)
	_, err := rand.Read(deviceCode)
	if err != nil {
		return err
	}

	userCode := make([]byte, 8)
	for i := range userCode {
		idx, err := rand.Int(rand.Reader, big.NewInt(26))
		if err != nil {
			return err
		}
		userCode[i] = 'A' + byte(idx.Int64())
	}

	dev := cmp.Or(c.QueryParam("device"), c.Request().Header.Get("User-Agent"))
	device := &dev
	if dev == "" {
		device = nil
	}

	login, err := h.db.CreateDeviceLogin(ctx, dbc.CreateDeviceLoginParams{
		DeviceCode: base64.RawURLEncoding.EncodeToString(deviceCode),
		UserCode:   string(userCode),
		Device:     device,
	})
	if err != nil {
		return err
	}

	go h.db.CleanupDeviceLogins(context.WithoutCancel(ctx))

	return c.JSON(http.StatusCreated, DeviceLogin{
		DeviceCode: login.DeviceCode,
		UserCode:   login.UserCode,
		ExpiresIn:  10 * 60,
		Interval:   5,
	})
}

// @Summary      Finish device login
// @Description  Poll a device login. Once approved, the login request is deleted and a session is created and returned.
// @Tags         sessions
// @Accept       json
// @Produce      json
// @Param        device  query   string         false  "The device the created session will be used on"  example(android tv)
// @Param        body    body    DeviceCodeDto  false  "Device code"
// @Success      201  {object}   SessionWToken
// @Failure      410  {object}   KError "Device code expired or already used"
// @Failure      428  {object}   KError "Login not yet approved by the user, retry later"
// @Router /device [delete]
func (h *Handler) PollDeviceLogin(c *echo.Context) error {
	ctx := c.Request().Context()
	var req DeviceCodeDto
	err := c.Bind(&req)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnprocessableEntity, err.Error())
	}
	if err = c.Validate(&req); err != nil {
		return err
	}

	login, err := h.db.ConsumeDeviceLogin(ctx, req.DeviceCode)
	if err == nil {
		return h.createSession(c, &User{Pk: *login.UserPk})
	}
	if err != pgx.ErrNoRows {
		return err
	}

	_, err = h.db.GetDeviceLogin(ctx, req.DeviceCode)
	if err == pgx.ErrNoRows {
		return echo.NewHTTPError(http.StatusGone, "Device code expired or already used")
	} else if err != nil {
		return err
	}
	return echo.NewHTTPError(http.StatusPreconditionRequired, "Login not yet approved")
}

// @Summary      Approve device login
// @Description  Login a device (like a TV) with the current account using the code displayed on the device.
// @Tags         sessions
// @Accept       json
// @Produce      json
// @Security     Jwt
// @Param        body  body      DeviceApproveDto  false  "User code"
// @Success      200   {object}  DeviceApproved
// @Failure      401   {object}  KError "Missing jwt token"
// @Failure      404   {object}  KError "Invalid or expired code"
// @Router /device [patch]
func (h *Handler) ApproveDeviceLogin(c *echo.Context) error {
	ctx := c.Request().Context()
	uid, err := GetCurrentUserId(c)
	if err != nil {
		return err
	}
	if uid == uuid.Nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "Guests can't login devices")
	}

	var req DeviceApproveDto
	err = c.Bind(&req)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnprocessableEntity, err.Error())
	}
	if err = c.Validate(&req); err != nil {
		return err
	}

	user, err := h.db.GetUser(ctx, dbc.GetUserParams{
		UseId: true,
		Id:    uid,
	})
	if err != nil {
		return err
	}

	login, err := h.db.ApproveDeviceLogin(ctx, dbc.ApproveDeviceLoginParams{
		UserCode: strings.Map(func(r rune) rune {
			if r == '-' || r == ' ' {
				return -1
			}
			return unicode.ToUpper(r)
		}, req.Code),
		UserPk: &user.User.Pk,
	})
	if err == pgx.ErrNoRows {
		return echo.NewHTTPError(http.StatusNotFound, "Invalid or expired code")
	} else if err != nil {
		return err
	}

	return c.JSON(http.StatusOK, DeviceApproved{
		Device: MapSession(&dbc.Session{Device: login.Device}).Device,
	})
}
