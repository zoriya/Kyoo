package main

import (
	"encoding/json"
	"fmt"
	"maps"
	"net/http"
	"net/url"
	"path"
	"slices"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/labstack/echo/v5"
)

const maxPresignDuration = 7 * 24 * time.Hour

type PresignRequest struct {
	// The list of requests the signature should be valid for.
	For []PresignRule `json:"for" validate:"required,min=1,dive"`
	// How long the signature stays valid (go duration, e.g. `24h`, at most 7 days).
	Duration string `json:"duration" validate:"required" example:"24h"`
	// Extra claims to add to the signed jwt. Protected claims (`sub`, `permissions`, ...) are rejected.
	Claims map[string]any `json:"claims,omitempty"`
}

type PresignRule struct {
	// The exact url (matched against the request path) this rule allows. Ignored when `prefix` is set.
	Url *string `json:"url" example:"/api/videos/example"`
	// The http verb this rule allows.
	Verb string `json:"verb" validate:"required" example:"GET"`
	// When set, matches this path and every path under it (`/videos/abc` does not match `/videos/abcd`) instead of the exact `url`.
	Prefix *string `json:"prefix,omitempty" example:"/videos/e05089d6-9179-4b5b-a63e-94dd5fc2a397"`
}

func (r PresignRule) matches(path string, method string) bool {
	if !strings.EqualFold(r.Verb, method) {
		return false
	}
	if r.Prefix != nil {
		prefix := strings.TrimSuffix(*r.Prefix, "/")
		return path == prefix || strings.HasPrefix(path, prefix+"/")
	}
	return r.Url != nil && path == *r.Url
}

type Presign struct {
	PresignRequest
	// The signature to append as a `x-presign` query parameter to any request allowed by `for`.
	Signature string `json:"signature" example:"eyJhbGciOiJSUzI1NiIsImtpZCI6Ii4uLiJ9.eyJmb3IiOlt7InVybCI6Ii4uLiJ9XX0.KMUFsID..."`
	// When this signature stops being valid.
	ExpireAt time.Time `json:"expireAt" example:"2025-03-29T18:20:05.267Z"`
}

// @Summary      Presign a group of urls
// @Description  Add the signature as a `x-presign` query parameter
// @Tags         jwt
// @Accept       json
// @Produce      json
// @Security     Jwt
// @Param        presign  body      PresignRequest  true  "The requests to presign"
// @Success      200  {object}  Presign
// @Failure      400  {object}  KError "Invalid parameters"
// @Failure      401  {object}  KError "Not logged in"
// @Failure      422  {object}  KError "Invalid body"
// @Router       /presign [post]
func (h *Handler) Presign(c *echo.Context) error {
	token, ok := c.Get("user").(*jwt.Token)
	if !ok || token == nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "Not logged in")
	}
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return echo.NewHTTPError(http.StatusForbidden, "Could not retrieve claims")
	}
	if _, ok := claims["presign"]; ok {
		return echo.NewHTTPError(http.StatusForbidden, "Cannot presign from a presigned request")
	}

	var dto PresignRequest
	if err := c.Bind(&dto); err != nil {
		return echo.NewHTTPError(http.StatusUnprocessableEntity, err.Error())
	}
	if err := c.Validate(&dto); err != nil {
		return err
	}

	for i := range dto.For {
		rule := &dto.For[i]
		if rule.Prefix != nil {
			path, err := urlPath(*rule.Prefix)
			if err != nil {
				return echo.NewHTTPError(http.StatusBadRequest, "Invalid `prefix` value: not an url")
			}
			rule.Prefix = &path
			rule.Url = nil
		} else if rule.Url != nil {
			path, err := urlPath(*rule.Url)
			if err != nil {
				return echo.NewHTTPError(http.StatusBadRequest, "Invalid `url` value: not an url")
			}
			rule.Url = &path
		} else {
			return echo.NewHTTPError(http.StatusBadRequest, "A `for` rule must have either `url` or `prefix`")
		}
		rule.Verb = strings.ToUpper(rule.Verb)
	}

	for key := range dto.Claims {
		if slices.Contains(h.config.ProtectedClaims, key) {
			return echo.NewHTTPError(
				http.StatusBadRequest,
				fmt.Sprintf("Cannot set the protected claim `%s`", key),
			)
		}
	}

	duration, err := time.ParseDuration(dto.Duration)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid `duration` value: not a valid duration")
	}
	if duration <= 0 || duration > maxPresignDuration {
		return echo.NewHTTPError(
			http.StatusBadRequest,
			fmt.Sprintf("Invalid `duration` value: must be positive and at most %s", maxPresignDuration),
		)
	}

	now := time.Now().UTC()
	expireAt := now.Add(duration)

	rules, err := json.Marshal(dto.For)
	if err != nil {
		return err
	}

	presignClaims := jwt.MapClaims{}
	maps.Copy(presignClaims, dto.Claims)
	maps.Copy(presignClaims, claims)
	presignClaims["presign"] = string(rules)
	presignClaims["iat"] = &jwt.NumericDate{Time: now}
	presignClaims["exp"] = &jwt.NumericDate{Time: expireAt}

	jwt := jwt.NewWithClaims(jwt.SigningMethodRS256, presignClaims)
	jwt.Header["kid"] = h.config.JwtKid
	signed, err := jwt.SignedString(h.config.JwtPrivateKey)
	if err != nil {
		return err
	}

	return c.JSON(http.StatusOK, Presign{
		PresignRequest: dto,
		Signature:      signed,
		ExpireAt:       expireAt,
	})
}

func getQueryPresign(c *echo.Context) string {
	if p := c.Request().URL.Query().Get("x-presign"); p != "" {
		return p
	}
	if fwd := c.Request().Header.Get("X-Forwarded-Uri"); fwd != "" {
		if u, err := url.Parse(fwd); err == nil {
			return u.Query().Get("x-presign")
		}
	}
	return ""
}

// presign signatures (and the jwts they are exchanged for) are signed like any jwt
// and carry the user's claims. they must only be accepted via `x-presign`, where
// their rules are checked. the signature is verified later, this only rejects.
func isPresignJwt(token string) bool {
	claims := jwt.MapClaims{}
	if _, _, err := jwt.NewParser().ParseUnverified(token, claims); err != nil {
		return false
	}
	_, ok := claims["presign"]
	return ok
}

func urlPath(raw string) (string, error) {
	parsed, err := url.Parse(raw)
	if err != nil {
		return "", err
	}
	if parsed.Path == "" {
		return "", fmt.Errorf("empty path")
	}
	return parsed.Path, nil
}

func (h *Handler) createPresignJwt(c *echo.Context, presign string) (string, error) {
	token, err := jwt.ParseWithClaims(presign, jwt.MapClaims{}, func(t *jwt.Token) (any, error) {
		if t.Method.Alg() != "RS256" {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return h.config.JwtPublicKey, nil
	})
	if err != nil {
		return "", echo.NewHTTPError(http.StatusForbidden, "Invalid presign signature")
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return "", echo.NewHTTPError(http.StatusForbidden, "Invalid presign claims")
	}

	presignJson, _ := claims["presign"].(string)
	var rules []PresignRule
	if json.Unmarshal([]byte(presignJson), &rules) != nil || len(rules) == 0 {
		return "", echo.NewHTTPError(http.StatusForbidden, "Not a presign signature")
	}

	sidStr, ok := claims["sid"].(string)
	if !ok {
		return "", echo.NewHTTPError(http.StatusForbidden, "Missing session id in presign signature")
	}
	sid, err := uuid.Parse(sidStr)
	if err != nil {
		return "", echo.NewHTTPError(http.StatusForbidden, "Invalid session id in presign signature")
	}
	if sid.String() != "00000000-0000-0000-0000-000000000000" {
		ctx := c.Request().Context()
		session, err := h.db.GetUserFromSessionId(ctx, sid)
		if err != nil {
			return "", echo.NewHTTPError(http.StatusForbidden, "Session not found")
		}
		if session.LastUsed.Add(h.config.ExpirationDelay).Compare(time.Now().UTC()) < 0 {
			return "", echo.NewHTTPError(http.StatusForbidden, "Session has expired")
		}

		go func() {
			h.db.TouchSession(ctx, session.Pk)
			h.db.TouchUser(ctx, session.User.Pk)
		}()
	}

	reqPath := c.Request().URL.Path
	if fwd := c.Request().Header.Get("X-Forwarded-Uri"); fwd != "" {
		if u, err := url.Parse(fwd); err == nil {
			reqPath = u.Path
		}
	}
	if cleaned := path.Clean(reqPath); cleaned != reqPath && cleaned+"/" != reqPath {
		return "", echo.NewHTTPError(http.StatusForbidden, "Presign signature is not valid for this request")
	}
	method := c.Request().Method
	if m := c.Request().Header.Get("X-Forwarded-Method"); m != "" {
		method = m
	}

	allowed := slices.ContainsFunc(rules, func(r PresignRule) bool {
		return r.matches(reqPath, method)
	})
	if !allowed {
		return "", echo.NewHTTPError(http.StatusForbidden, "Presign signature is not valid for this request")
	}

	now := time.Now().UTC()
	exp := now.Add(time.Hour)
	if sigExp, err := claims.GetExpirationTime(); err == nil && sigExp != nil && sigExp.Before(exp) {
		exp = sigExp.Time
	}
	claims["jti"] = uuid.New().String()
	claims["iss"] = h.config.PublicUrl
	claims["iat"] = &jwt.NumericDate{Time: now}
	claims["exp"] = &jwt.NumericDate{Time: exp}

	jwtTok := jwt.NewWithClaims(jwt.SigningMethodRS256, claims)
	jwtTok.Header["kid"] = h.config.JwtKid
	return jwtTok.SignedString(h.config.JwtPrivateKey)
}
