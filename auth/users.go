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
	// Id of the user.
	Id uuid.UUID `json:"id"`
	// Username of the user. Can be used as a login.
	Username string `json:"username"`
	// Email of the user. Can be used as a login.
	Email string `json:"email" format:"email"`
	// When was this account created?
	CreatedDate time.Time `json:"createdDate"`
	// When was the last time this account made any authorized request?
	LastSeen time.Time `json:"lastSeen"`
	// List of custom claims JWT created via get /jwt will have
	Claims jwt.MapClaims `json:"claims"`
	// List of other login method available for this user. Access tokens wont be returned here.
	Oidc map[string]OidcHandle `json:"oidc,omitempty"`
}

type OidcHandle struct {
	// Id of this oidc handle.
	Id string `json:"id"`
	// Username of the user on the external service.
	Username string `json:"username"`
	// Link to the profile of the user on the external service. Null if unknown or irrelevant.
	ProfileUrl *string `json:"profileUrl" format:"url"`
}

type RegisterDto struct {
	// Username of the new account, can't contain @ signs. Can be used for login.
	Username string `json:"username" validate:"required,excludes=@"`
	// Valid email that could be used for forgotten password requests. Can be used for login.
	Email string `json:"email" validate:"required,email" format:"email"`
	// Password to use.
	Password string `json:"password" validate:"required"`
}

func MapDbUser(user *dbc.User) User {
	return User{
		Id:          user.Id,
		Username:    user.Username,
		Email:       user.Email,
		CreatedDate: user.CreatedDate,
		LastSeen:    user.LastSeen,
		Claims:      user.Claims,
		Oidc:        nil,
	}
}

func MapOidc(oidc *dbc.OidcHandle) OidcHandle {
	return OidcHandle{
		Id:         oidc.Id,
		Username:   oidc.Username,
		ProfileUrl: oidc.ProfileUrl,
	}
}

// @Summary      List all users
// @Description  List all users existing in this instance.
// @Tags         users
// @Accept       json
// @Produce      json
// @Security     Jwt[users.read]
// @Param        afterId   query      string  false  "used for pagination." Format(uuid)
// @Success      200  {object}  User[]
// @Failure      400  {object}  problem.Problem "Invalid after id"
// @Router       /users [get]
func (h *Handler) ListUsers(c echo.Context) error {
	err := CheckPermission(c, []string{"user.read"})
	if err != nil {
		return err
	}

	ctx := context.Background()
	limit := int32(20)
	id := c.Param("afterId")

	var users []dbc.User
	if id == "" {
		users, err = h.db.GetAllUsers(ctx, limit)
	} else {
		uid, uerr := uuid.Parse(id)
		if uerr != nil {
			return echo.NewHTTPError(400, "Invalid `afterId` parameter, uuid was expected")
		}
		users, err = h.db.GetAllUsersAfter(ctx, dbc.GetAllUsersAfterParams{
			Limit:   limit,
			AfterId: uid,
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

// @Summary      Get user
// @Description  Get informations about a user from it's id
// @Tags         users
// @Produce      json
// @Security     Jwt[users.read]
// @Param        id   path      string    true  "The id of the user" Format(uuid)
// @Success      200  {object}  User
// @Failure      404  {object}  problem.Problem "No user with the given id found"
// @Router /users/{id} [get]
func (h *Handler) GetUser(c echo.Context) error {
	err := CheckPermission(c, []string{"user.read"})
	if err != nil {
		return err
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(400, "Invalid id")
	}
	dbuser, err := h.db.GetUser(context.Background(), id)
	if err != nil {
		return err
	}

	user := MapDbUser(&dbuser[0].User)
	for _, oidc := range dbuser {
		user.Oidc[oidc.OidcHandle.Provider] = MapOidc(&oidc.OidcHandle)
	}

	return c.JSON(200, user)
}

// @Summary      Get me
// @Description  Get informations about the currently connected user
// @Tags         users
// @Produce      json
// @Security     Jwt
// @Success      200  {object}  User
// @Failure      401  {object}  problem.Problem "Missing jwt token"
// @Failure      403  {object}  problem.Problem "Invalid jwt token (or expired)"
// @Router /users/me [get]
func (h *Handler) GetMe(c echo.Context) error {
	id, err := GetCurrentUserId(c)
	if err != nil {
		return err
	}
	dbuser, err := h.db.GetUser(context.Background(), id)
	if err != nil {
		return err
	}

	user := MapDbUser(&dbuser[0].User)
	for _, oidc := range dbuser {
		user.Oidc[oidc.OidcHandle.Provider] = MapOidc(&oidc.OidcHandle)
	}

	return c.JSON(200, user)
}

// @Summary      Register
// @Description  Register as a new user and open a session for it
// @Tags         users
// @Accept       json
// @Produce      json
// @Param        device   query   uuid         false  "The device the created session will be used on"
// @Param        user     body    RegisterDto  false  "Registration informations"
// @Success      201  {object}  dbc.Session
// @Failure      400  {object}  problem.Problem "Invalid register body"
// @Success      409  {object}  problem.Problem "Duplicated email or username"
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
		return err
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
