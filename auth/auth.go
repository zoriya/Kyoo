package main

import (
	"context"
	"database/sql"
	"net/http"

	"github.com/alexedwards/argon2id"
	"github.com/labstack/echo/v4"
	"github.com/zoriya/kyoo/keibi/dbc"
)

type LoginDto struct {
	Login    string `json:"login" validate:"required"`
	Password string `json:"password" validate:"required"`
}

type RegisterDto struct {
	Username string `json:"username" validate:"required"`
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

func (h *Handler) Register(c echo.Context) error {
	var req RegisterDto
	err := c.Bind(&req)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	if err = c.Validate(&req); err != nil {
		return err
	}

	pass, err := argon2id.CreateHash(req.Password, argon2id.DefaultParams)
	if err != nil {
		return echo.NewHTTPError(400, "Invalid password")
	}

	user, err := h.db.CreateUser(context.Background(), dbc.CreateUserParams{
		Username:       req.Username,
		Email:          req.Email,
		Password:       sql.NullString{},
		ExternalHandle: []byte{},
		Claims:         []byte{},
	})
	if err != nil {
		return echo.NewHTTPError(409, "Email or username already taken")
	}
	return h.CreateToken(c, &user)
}
