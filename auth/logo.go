package main

import (
	"bytes"
	"context"
	"crypto/md5"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
	"net/http"
	"slices"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/labstack/echo/v5"
	"github.com/zoriya/kyoo/keibi/dbc"
	"github.com/zoriya/kyoo/keibi/storage"
)

const maxLogoSize = 5 << 20

var allowedLogoTypes = []string{
	"image/jpeg",
	"image/png",
	"image/gif",
	"image/webp",
}

func (h *Handler) streamManualLogo(c *echo.Context, id uuid.UUID) error {
	data, err := h.pictures.Read(c.Request().Context(), id.String())
	if errors.Is(err, storage.ErrNotExist) {
		return echo.NewHTTPError(http.StatusNotFound, "No manual logo found")
	}
	if err != nil {
		return err
	}

	contentType := http.DetectContentType(data)
	return c.Stream(http.StatusOK, contentType, bytes.NewReader(data))
}

func (h *Handler) writeManualLogo(id uuid.UUID, data []byte) error {
	return h.pictures.Write(context.Background(), id.String(), data)
}

func (h *Handler) downloadLogo(ctx context.Context, id uuid.UUID, logoURL string) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, logoURL, nil)
	if err != nil {
		return err
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("unexpected logo response status: %d", resp.StatusCode)
	}

	data, err := io.ReadAll(io.LimitReader(resp.Body, maxLogoSize+1))
	if err != nil {
		return err
	}
	if len(data) > maxLogoSize {
		return fmt.Errorf("logo file too large")
	}

	if !slices.Contains(allowedLogoTypes, http.DetectContentType(data)) {
		return fmt.Errorf("unsupported logo content type")
	}

	return h.writeManualLogo(id, data)
}

func (h *Handler) streamGravatar(c *echo.Context, email string) error {
	hash := md5.Sum([]byte(strings.TrimSpace(strings.ToLower(email))))
	url := fmt.Sprintf("https://www.gravatar.com/avatar/%s?d=404", hex.EncodeToString(hash[:]))

	req, err := http.NewRequestWithContext(c.Request().Context(), http.MethodGet, url, nil)
	if err != nil {
		return err
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadGateway, "Could not fetch gravatar image")
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		return echo.NewHTTPError(http.StatusNotFound, "No gravatar image found for this user")
	}
	if resp.StatusCode != http.StatusOK {
		return echo.NewHTTPError(http.StatusBadGateway, "Could not fetch gravatar image")
	}

	contentType := resp.Header.Get("Content-Type")
	if contentType == "" {
		contentType = "application/octet-stream"
	}

	return c.Stream(http.StatusOK, contentType, resp.Body)
}

// @Summary      Get my logo
// @Description  Get the current user's logo (manual upload if available, gravatar otherwise)
// @Tags         users
// @Produce      image/*
// @Security     Jwt
// @Success      200  {file}  binary
// @Failure      401  {object}  KError "Missing jwt token"
// @Failure      403  {object}  KError "Invalid jwt token (or expired)"
// @Failure      404  {object}  KError "No gravatar image found for this user"
// @Router /users/me/logo [get]
func (h *Handler) GetMyLogo(c *echo.Context) error {
	ctx := c.Request().Context()
	id, err := GetCurrentUserId(c)
	if err != nil {
		return err
	}

	if err := h.streamManualLogo(c, id); err == nil {
		return nil
	} else if httpErr, ok := err.(*echo.HTTPError); !ok || httpErr.Code != http.StatusNotFound {
		return err
	}

	user, err := h.db.GetUser(ctx, dbc.GetUserParams{
		UseId: true,
		Id:    id,
	})
	if err != nil {
		return err
	}

	return h.streamGravatar(c, user.User.Email)
}

// @Summary      Get user logo
// @Description  Get a user's logo (manual upload if available, gravatar otherwise)
// @Tags         users
// @Produce      image/*
// @Security     Jwt[users.read]
// @Param        id   path      string    true  "The id or username of the user"
// @Success      200  {file}  binary
// @Failure      404  {object}  KError "No user found with id or username"
// @Failure      404  {object}  KError "No gravatar image found for this user"
// @Router /users/{id}/logo [get]
func (h *Handler) GetUserLogo(c *echo.Context) error {
	ctx := c.Request().Context()
	err := CheckPermissions(c, []string{"users.read"})
	if err != nil {
		return err
	}

	id := c.Param("id")
	uid, err := uuid.Parse(id)
	user, err := h.db.GetUser(ctx, dbc.GetUserParams{
		UseId:    err == nil,
		Id:       uid,
		Username: id,
	})
	if err == pgx.ErrNoRows {
		return echo.NewHTTPError(404, fmt.Sprintf("No user found with id or username: '%s'.", id))
	} else if err != nil {
		return err
	}

	if err := h.streamManualLogo(c, user.User.Id); err == nil {
		return nil
	} else if httpErr, ok := err.(*echo.HTTPError); !ok || httpErr.Code != http.StatusNotFound {
		return err
	}

	return h.streamGravatar(c, user.User.Email)
}

// @Summary      Upload my logo
// @Description  Upload a manual profile picture for the current user
// @Tags         users
// @Accept       multipart/form-data
// @Produce      json
// @Security     Jwt
// @Param        logo  formData  file  true  "Profile picture image (jpeg/png/gif/webp, max 5MB)"
// @Success      204
// @Failure      401  {object}  KError "Missing jwt token"
// @Failure      403  {object}  KError "Invalid jwt token (or expired)"
// @Failure      413  {object}  KError "File too large"
// @Failure      422  {object}  KError "Missing or invalid logo file"
// @Router /users/me/logo [post]
func (h *Handler) UploadMyLogo(c *echo.Context) error {
	id, err := GetCurrentUserId(c)
	if err != nil {
		return err
	}

	fileHeader, err := c.FormFile("logo")
	if err != nil {
		return echo.NewHTTPError(http.StatusUnprocessableEntity, "Missing form file `logo`")
	}
	if fileHeader.Size > maxLogoSize {
		return echo.NewHTTPError(http.StatusRequestEntityTooLarge, "File too large")
	}

	file, err := fileHeader.Open()
	if err != nil {
		return err
	}
	defer file.Close()

	data, err := io.ReadAll(io.LimitReader(file, maxLogoSize+1))
	if err != nil {
		return err
	}
	if len(data) > maxLogoSize {
		return echo.NewHTTPError(http.StatusRequestEntityTooLarge, "File too large")
	}

	if !slices.Contains(allowedLogoTypes, http.DetectContentType(data)) {
		return echo.NewHTTPError(http.StatusUnprocessableEntity, "Only jpeg, png, gif or webp images are allowed")
	}

	if err := h.writeManualLogo(id, data); err != nil {
		return err
	}
	return c.NoContent(http.StatusNoContent)
}

// @Summary      Delete my logo
// @Description  Delete the current user's manually uploaded profile picture
// @Tags         users
// @Produce      json
// @Security     Jwt
// @Success      204
// @Failure      401  {object}  KError "Missing jwt token"
// @Failure      403  {object}  KError "Invalid jwt token (or expired)"
// @Router /users/me/logo [delete]
func (h *Handler) DeleteMyLogo(c *echo.Context) error {
	id, err := GetCurrentUserId(c)
	if err != nil {
		return err
	}

	err = h.pictures.Delete(c.Request().Context(), id.String())
	if errors.Is(err, storage.ErrNotExist) {
		return echo.NewHTTPError(
			404,
			"User does not have a custom profile picture.",
		)
	} else if err != nil {
		return err
	}
	return c.NoContent(http.StatusNoContent)
}

// @Summary      Delete user logo
// @Description  Delete the user's manually uploaded profile picture
// @Tags         users
// @Produce      json
// @Security     Jwt
// @Success      204
// @Param        id   path      string    true  "The id or username of the user"
// @Failure      401  {object}  KError "Missing jwt token"
// @Failure      403  {object}  KError "Invalid jwt token (or expired)"
// @Router /users/me/{id} [delete]
func (h *Handler) DeleteUserLogo(c *echo.Context) error {
	ctx := c.Request().Context()
	err := CheckPermissions(c, []string{"users.write"})
	if err != nil {
		return err
	}

	id := c.Param("id")
	uid, err := uuid.Parse(id)
	user, err := h.db.GetUser(ctx, dbc.GetUserParams{
		UseId:    err == nil,
		Id:       uid,
		Username: id,
	})
	if err == pgx.ErrNoRows {
		return echo.NewHTTPError(404, fmt.Sprintf("No user found with id or username: '%s'.", id))
	} else if err != nil {
		return err
	}

	err = h.pictures.Delete(ctx, user.User.Id.String())
	if errors.Is(err, storage.ErrNotExist) {
		return echo.NewHTTPError(
			404,
			"User does not have a custom profile picture.",
		)
	} else if err != nil {
		return err
	}
	return c.NoContent(http.StatusNoContent)
}
