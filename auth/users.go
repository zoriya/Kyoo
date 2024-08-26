package main

import (
	"context"
	"time"

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
	Oidc        map[string]OidcHandle `json:"oidc,omitempty"`
}

type OidcHandle struct {
	Id         string  `json:"id"`
	Username   string  `json:"username"`
	ProfileUrl *string `json:"profileUrl"`
}

func MapDbUser(user *dbc.User) User {
	return User{
		ID:          user.ID,
		Username:    user.Username,
		Email:       user.Email,
		CreatedDate: user.CreatedDate,
		LastSeen:    user.LastSeen,
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
