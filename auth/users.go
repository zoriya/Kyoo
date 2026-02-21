package main

import (
	"fmt"
	"net/http"
	"time"

	"github.com/alexedwards/argon2id"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgerrcode"
	"github.com/jackc/pgx/v5"
	"github.com/labstack/echo/v5"
	"github.com/zoriya/kyoo/keibi/dbc"
)

type User struct {
	// Primary key in database
	Pk int32 `json:"-"`
	// Id of the user.
	Id uuid.UUID `json:"id" example:"e05089d6-9179-4b5b-a63e-94dd5fc2a397"`
	// Username of the user. Can be used as a login.
	Username string `json:"username" example:"zoriya"`
	// Email of the user. Can be used as a login.
	Email string `json:"email" format:"email" example:"kyoo@zoriya.dev"`
	// When was this account created?
	CreatedDate time.Time `json:"createdDate" example:"2025-03-29T18:20:05.267Z"`
	// When was the last time this account made any authorized request?
	LastSeen time.Time `json:"lastSeen" example:"2025-03-29T18:20:05.267Z"`
	// List of custom claims JWT created via get /jwt will have
	Claims jwt.MapClaims `json:"claims" example:"isAdmin: true"`
	// List of other login method available for this user. Access tokens wont be returned here.
	Oidc map[string]OidcHandle `json:"oidc,omitempty"`
}

type OidcHandle struct {
	// Id of this oidc handle.
	Id string `json:"id" example:"e05089d6-9179-4b5b-a63e-94dd5fc2a397"`
	// Username of the user on the external service.
	Username string `json:"username" example:"zoriya"`
	// Link to the profile of the user on the external service. Null if unknown or irrelevant.
	ProfileUrl *string `json:"profileUrl" format:"url" example:"https://myanimelist.net/profile/zoriya"`
}

type RegisterDto struct {
	// Username of the new account, can't contain @ signs. Can be used for login.
	Username string `json:"username" validate:"required,excludes=@" example:"zoriya"`
	// Valid email that could be used for forgotten password requests. Can be used for login.
	Email string `json:"email" validate:"required,email" format:"email" example:"kyoo@zoriya.dev"`
	// Password to use.
	Password string `json:"password" validate:"required" example:"password1234"`
}

type EditUserDto struct {
	Username *string       `json:"username,omitempty" validate:"omitnil,excludes=@" example:"zoriya"`
	Email    *string       `json:"email,omitempty" validate:"omitnil,email" example:"kyoo@zoriya.dev"`
	Claims   jwt.MapClaims `json:"claims,omitempty" example:"preferOriginal: true"`
}

type EditPasswordDto struct {
	OldPassword string `json:"oldPassword" validate:"required" example:"password1234"`
	NewPassword string `json:"newPassword" validate:"required" example:"password1234"`
}

func MapDbUser(user *dbc.User) User {
	return User{
		Pk:          user.Pk,
		Id:          user.Id,
		Username:    user.Username,
		Email:       user.Email,
		CreatedDate: user.CreatedDate,
		LastSeen:    user.LastSeen,
		Claims:      user.Claims,
		Oidc:        nil,
	}
}

func MapOidc(oidc *dbc.GetUserRow) OidcHandle {
	return OidcHandle{
		Id:         *oidc.Id,
		Username:   *oidc.Username,
		ProfileUrl: oidc.ProfileUrl,
	}
}

// @Summary      List all users
// @Description  List all users existing in this instance.
// @Tags         users
// @Accept       json
// @Produce      json
// @Security     Jwt[users.read]
// @Param        after   query      string  false  "used for pagination."
// @Success      200  {object}  Page[User]
// @Failure      422  {object}  KError "Invalid after id"
// @Router       /users [get]
func (h *Handler) ListUsers(c *echo.Context) error {
	ctx := c.Request().Context()

	err := CheckPermissions(c, []string{"users.read"})
	if err != nil {
		return err
	}

	limit := int32(20)
	id := c.Param("after")

	var users []dbc.User
	if id == "" {
		users, err = h.db.GetAllUsers(ctx, limit)
	} else {
		uid, uerr := uuid.Parse(id)
		if uerr != nil {
			return echo.NewHTTPError(http.StatusUnprocessableEntity, "Invalid `after` parameter, uuid was expected")
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
	return c.JSON(200, NewPage(ret, c.Request().URL, limit))
}

// @Summary      Get user
// @Description  Get informations about a user from it's id
// @Tags         users
// @Produce      json
// @Security     Jwt[users.read]
// @Param        id   path      string    true  "The id of the user" Format(uuid)
// @Success      200  {object}  User
// @Failure      404  {object}  KError "No user with the given id found"
// @Failure      422  {object}  KError "Invalid id (not a uuid)"
// @Router /users/{id} [get]
func (h *Handler) GetUser(c *echo.Context) error {
	ctx := c.Request().Context()
	err := CheckPermissions(c, []string{"users.read"})
	if err != nil {
		return err
	}

	id := c.Param("id")
	uid, err := uuid.Parse(c.Param("id"))
	dbuser, err := h.db.GetUser(ctx, dbc.GetUserParams{
		UseId:    err == nil,
		Id:       uid,
		Username: id,
	})
	if err != nil {
		return err
	}
	if len(dbuser) == 0 {
		return echo.NewHTTPError(404, fmt.Sprintf("No user found with id or username: '%s'.", id))
	}

	user := MapDbUser(&dbuser[0].User)
	for _, oidc := range dbuser {
		if oidc.Provider != nil {
			user.Oidc[*oidc.Provider] = MapOidc(&oidc)
		}
	}

	return c.JSON(200, user)
}

// @Summary      Get me
// @Description  Get informations about the currently connected user
// @Tags         users
// @Produce      json
// @Security     Jwt
// @Success      200  {object}  User
// @Failure      401  {object}  KError "Missing jwt token"
// @Failure      403  {object}  KError "Invalid jwt token (or expired)"
// @Router /users/me [get]
func (h *Handler) GetMe(c *echo.Context) error {
	ctx := c.Request().Context()
	id, err := GetCurrentUserId(c)
	if err != nil {
		return err
	}
	dbuser, err := h.db.GetUser(ctx, dbc.GetUserParams{
		UseId: true,
		Id:    id,
	})
	if err != nil {
		return err
	}
	if len(dbuser) == 0 {
		return c.JSON(403, "Invalid jwt token, couldn't find user.")
	}

	user := MapDbUser(&dbuser[0].User)
	for _, oidc := range dbuser {
		if oidc.Provider != nil {
			user.Oidc[*oidc.Provider] = MapOidc(&oidc)
		}
	}

	return c.JSON(200, user)
}

// @Summary      Register
// @Description  Register as a new user and open a session for it
// @Tags         users
// @Accept       json
// @Produce      json
// @Param        device   query   string         false  "The device the created session will be used on"  Example(android)
// @Param        user     body    RegisterDto  false  "Registration informations"
// @Success      201  {object}  SessionWToken
// @Success      409  {object}  KError "Duplicated email or username"
// @Failure      422  {object}  KError "Invalid register body"
// @Router /users [post]
func (h *Handler) Register(c *echo.Context) error {
	ctx := c.Request().Context()
	var req RegisterDto
	err := c.Bind(&req)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnprocessableEntity, err.Error())
	}
	if err = c.Validate(&req); err != nil {
		return err
	}

	pass, err := argon2id.CreateHash(req.Password, argon2id.DefaultParams)
	if err != nil {
		return err
	}

	duser, err := h.db.CreateUser(ctx, dbc.CreateUserParams{
		Username:    req.Username,
		Email:       req.Email,
		Password:    &pass,
		Claims:      h.config.DefaultClaims,
		FirstClaims: h.config.FirstUserClaims,
	})
	if ErrIs(err, pgerrcode.UniqueViolation) {
		return echo.NewHTTPError(409, "Email or username already taken")
	} else if err != nil {
		return err
	}
	user := MapDbUser(&duser)
	return h.createSession(c, &user)
}

// @Summary      Delete user
// @Description  Delete an account and all it's sessions.
// @Tags         users
// @Accept       json
// @Produce      json
// @Security     Jwt[users.delete]
// @Param        id   path      string  false  "User id of the user to delete" Format(uuid)
// @Success      200  {object}  User
// @Failure      404  {object}  KError "Invalid user id"
// @Failure      422  {object}  KError "Invalid id format"
// @Router /users/{id} [delete]
func (h *Handler) DeleteUser(c *echo.Context) error {
	ctx := c.Request().Context()
	err := CheckPermissions(c, []string{"users.delete"})
	if err != nil {
		return err
	}

	uid, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(422, "Invalid id given: not an uuid")
	}

	ret, err := h.db.DeleteUser(ctx, uid)
	if err == pgx.ErrNoRows {
		return echo.NewHTTPError(404, "No user found with given id")
	} else if err != nil {
		return err
	}
	return c.JSON(200, MapDbUser(&ret))
}

// @Summary      Delete self
// @Description  Delete your account and all your sessions
// @Tags         users
// @Accept       json
// @Produce      json
// @Security     Jwt
// @Success      200  {object}  User
// @Router /users/me [delete]
func (h *Handler) DeleteSelf(c *echo.Context) error {
	ctx := c.Request().Context()
	uid, err := GetCurrentUserId(c)
	if err != nil {
		return err
	}

	ret, err := h.db.DeleteUser(ctx, uid)
	if err == pgx.ErrNoRows {
		return echo.NewHTTPError(403, "Invalid token, user already deleted.")
	} else if err != nil {
		return err
	}
	return c.JSON(200, MapDbUser(&ret))
}

// @Summary      Edit self
// @Description  Edit your account's info
// @Tags         users
// @Accept       json
// @Produce      json
// @Security     Jwt
// @Param        user     body  EditUserDto  false  "Edited user info"
// @Success      200  {object}  User
// @Success      403  {object}  KError  "You can't edit a protected claim"
// @Success      422  {object}  KError  "Invalid body"
// @Router /users/me [patch]
func (h *Handler) EditSelf(c *echo.Context) error {
	ctx := c.Request().Context()
	var req EditUserDto
	err := c.Bind(&req)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnprocessableEntity, err.Error())
	}
	if err = c.Validate(&req); err != nil {
		return err
	}

	for _, key := range h.config.ProtectedClaims {
		if _, contains := req.Claims[key]; contains {
			return echo.NewHTTPError(http.StatusForbidden, fmt.Sprintf("Can't edit protected claim: '%s'.", key))
		}
	}

	uid, err := GetCurrentUserId(c)
	if err != nil {
		return err
	}

	ret, err := h.db.UpdateUser(ctx, dbc.UpdateUserParams{
		Id:       uid,
		Username: req.Username,
		Email:    req.Email,
		Claims:   req.Claims,
	})
	if err == pgx.ErrNoRows {
		return echo.NewHTTPError(http.StatusNotFound, "Invalid token, user not found.")
	} else if err != nil {
		return err
	}

	return c.JSON(200, MapDbUser(&ret))
}

// @Summary      Edit user
// @Description  Edit an account info or permissions
// @Tags         users
// @Accept       json
// @Produce      json
// @Security     Jwt[users.write]
// @Param        id       path  string  false  "User id of the user to edit" Format(uuid)
// @Param        user     body  EditUserDto  false  "Edited user info"
// @Success      200  {object}  User
// @Success      403  {object}  KError  "You don't have permissions to edit another account"
// @Success      422  {object}  KError  "Invalid body"
// @Router /users/{id} [patch]
func (h *Handler) EditUser(c *echo.Context) error {
	ctx := c.Request().Context()
	err := CheckPermissions(c, []string{"users.write"})
	if err != nil {
		return err
	}

	uid, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(400, "Invalid id given: not an uuid")
	}

	var req EditUserDto
	err = c.Bind(&req)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnprocessableEntity, err.Error())
	}
	if err = c.Validate(&req); err != nil {
		return err
	}

	ret, err := h.db.UpdateUser(ctx, dbc.UpdateUserParams{
		Id:       uid,
		Username: req.Username,
		Email:    req.Email,
		Claims:   req.Claims,
	})
	if err == pgx.ErrNoRows {
		return echo.NewHTTPError(http.StatusNotFound, "Invalid user id, user not found")
	} else if err != nil {
		return err
	}

	return c.JSON(200, MapDbUser(&ret))
}

// @Summary      Edit password
// @Description  Edit your password
// @Tags         users
// @Accept       json
// @Produce      json
// @Security     Jwt
// @Param        invalidate  query  bool  false  "Invalidate other sessions" default(true)
// @Param        user     body  EditPasswordDto  false  "New password"
// @Success      204
// @Success      422  {object}  KError  "Invalid body"
// @Router /users/me/password [patch]
func (h *Handler) ChangePassword(c *echo.Context) error {
	ctx := c.Request().Context()
	uid, err := GetCurrentUserId(c)
	if err != nil {
		return err
	}
	user, err := h.db.GetUser(ctx, dbc.GetUserParams{
		UseId: true,
		Id:    uid,
	})

	sid, err := GetCurrentSessionId(c)
	if err != nil {
		return err
	}

	var req EditPasswordDto
	err = c.Bind(&req)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnprocessableEntity, err.Error())
	}
	if err = c.Validate(&req); err != nil {
		return err
	}

	match, err := argon2id.ComparePasswordAndHash(
		req.OldPassword,
		*user[0].User.Password,
	)
	if err != nil {
		return err
	}
	if !match {
		return echo.NewHTTPError(http.StatusForbidden, "Invalid password")
	}

	pass, err := argon2id.CreateHash(req.NewPassword, argon2id.DefaultParams)
	if err != nil {
		return err
	}
	_, err = h.db.UpdateUser(ctx, dbc.UpdateUserParams{
		Id:       uid,
		Password: &pass,
	})
	if err != nil {
		return err
	}

	err = h.db.ClearOtherSessions(ctx, dbc.ClearOtherSessionsParams{
		SessionId: sid,
		UserId:    uid,
	})
	if err != nil {
		return err
	}

	return c.NoContent(http.StatusNoContent)
}
