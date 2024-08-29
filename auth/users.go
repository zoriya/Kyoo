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
	Email       string                `json:"email" format:"email"`
	CreatedDate time.Time             `json:"createdDate"`
	LastSeen    time.Time             `json:"lastSeen"`
	Claims      jwt.MapClaims         `json:"claims"`
	Oidc        map[string]OidcHandle `json:"oidc,omitempty"`
}

type OidcHandle struct {
	Id         string  `json:"id"`
	Username   string  `json:"username"`
	ProfileUrl *string `json:"profileUrl" format:"url"`
}

type RegisterDto struct {
	Username string `json:"username" validate:"required"`
	Email    string `json:"email" validate:"required,email" format:"email"`
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

// @Summary      List all users
// @Description  List all users existing in this instance.
// @Tags         users
// @Accept       json
// @Produce      json
// @Param        afterId   query      uuid  false  "used for pagination."
// @Success      200  {object}  User[]
// @Failure      400  {object}  problem.Problem
// @Router       /users [get]
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
	// TODO: switch to a Page
	return c.JSON(200, ret)
}

// @Summary      Register
// @Description  Register as a new user and open a session for it
// @Tags         users
// @Accept       json
// @Produce      json
// @Param        device   query   uuid         false  "The device the created session will be used on"
// @Param        user     body    RegisterDto  false  "Registration informations"
// @Success      201  {object}  dbc.Session
// @Failure      400  {object}  problem.Problem
// @Router /users [post]
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
	return h.createSession(c, &user)
}
