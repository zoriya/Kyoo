package main

import (
	"context"
	"net/http"
	"time"

	"github.com/alexedwards/argon2id"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"github.com/zoriya/kyoo/keibi/dbc"
)

type User struct {
	ID          uuid.UUID             `json:"id"`
	Username    string                `json:"username"`
	Email       string                `json:"email"`
	CreatedDate time.Time             `json:"createdDate"`
	LastSeen    time.Time             `json:"lastSeen"`
	Claims      jwt.MapClaims         `json:"claims"`
	Oidc        map[string]OidcHandle `json:"oidc,omitempty"`
}

type OidcHandle struct {
	Id         string  `json:"id"`
	Username   string  `json:"username"`
	ProfileUrl *string `json:"profileUrl"`
}

type RegisterDto struct {
	Username string `json:"username" validate:"required"`
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

func MapDbUser(user *dbc.User) User {
	return User{
		ID:          user.ID,
		Username:    user.Username,
		Email:       user.Email,
		CreatedDate: user.CreatedDate,
		LastSeen:    user.LastSeen,
		Claims:      user.Claims,
		Oidc:        nil,
	}
}

func (h *Handler) ListUsers(c echo.Context) error {
	ctx := context.Background()
	limit := int32(20)
	id := c.Param("afterId")

	var users []dbc.User
	var err error
	if id == "" {
		users, err = h.db.GetAllUsers(ctx, limit)
	} else {
		uid, uerr := uuid.Parse(id)
		if uerr != nil {
			return echo.NewHTTPError(400, "Invalid `afterId` parameter, uuid was expected")
		}
		users, err = h.db.GetAllUsersAfter(ctx, dbc.GetAllUsersAfterParams{
			Limit:   limit,
			AfterID: uid,
		})
	}

	if err != nil {
		return err
	}

	var ret []User
	for _, user := range users {
		ret = append(ret, MapDbUser(&user))
	}
	return c.JSON(200, ret)
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

	duser, err := h.db.CreateUser(context.Background(), dbc.CreateUserParams{
		Username: req.Username,
		Email:    req.Email,
		Password: &pass,
		Claims:   h.config.DefaultClaims,
	})
	if err != nil {
		return echo.NewHTTPError(409, "Email or username already taken")
	}
	user := MapDbUser(&duser)
	return h.createToken(c, &user)
}
