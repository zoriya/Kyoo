package main

import (
	"cmp"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgerrcode"
	"github.com/jackc/pgx/v5"
	"github.com/labstack/echo/v5"
	"github.com/zoriya/kyoo/keibi/dbc"
	"github.com/zoriya/kyoo/keibi/models"
)

type OidcProvider struct {
	Id   string `json:"id" example:"google"`
	Name string `json:"name" example:"Google"`
	Logo string `json:"logo,omitempty" format:"url" example:"https://www.gstatic.com/marketing-cms/assets/images/d5/dc/cfe9ce8b4425b410b49b7f2dd3f3/g.webp=s200"`
}

func (h *Handler) getOidcProvider(provider string) (OidcProviderConfig, error) {
	p, ok := h.config.OidcProviders[strings.ToLower(provider)]
	if !ok {
		return OidcProviderConfig{}, echo.NewHTTPError(http.StatusNotFound, "Unknown OIDC provider")
	}
	return p, nil
}

func (h *Handler) isAllowedRedirectUrl(redirectURL string) bool {
	u, err := url.Parse(redirectURL)
	if err != nil || u.Scheme == "" {
		return false
	}

	// Loopback (RFC 8252) is always allowed: native/CLI apps bind an ephemeral port.
	scheme, host := strings.ToLower(u.Scheme), strings.ToLower(u.Hostname())
	if (scheme == "http" || scheme == "https") &&
		(host == "127.0.0.1" || host == "::1" || host == "localhost") {
		return true
	}

	for _, rule := range h.config.OidcRedirectUrls {
		if !strings.EqualFold(u.Scheme, rule.Scheme) {
			continue
		}
		// Empty host: custom-scheme native app. Else require an exact origin match.
		if rule.Host == "" || strings.EqualFold(u.Host, rule.Host) {
			return true
		}
	}
	return false
}

// @Summary      OIDC login
// @Description  Start an OIDC login with a provider.
// @Tags         oidc
// @Produce      json
// @Param        provider     path  string  true   "OIDC provider id"  Example(google)
// @Param        redirectUrl  query string  true   "URL to redirect the browser to after provider callback"
// @Param        tenant       query string  false  "Optional tenant passthrough for federated setups"
// @Success      302
// @Failure      400  {object}  KError "Missing redirectUrl"
// @Failure      404  {object}  KError "Unknown OIDC provider"
// @Router /oidc/login/{provider} [get]
func (h *Handler) OidcLogin(c *echo.Context) error {
	ctx := c.Request().Context()
	provider, err := h.getOidcProvider(c.Param("provider"))
	if err != nil {
		return err
	}

	redirectURL := c.QueryParam("redirectUrl")
	if redirectURL == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "Missing redirectUrl")
	}
	if !h.isAllowedRedirectUrl(redirectURL) {
		return echo.NewHTTPError(http.StatusBadRequest, "Unauthorized redirectUrl, ask your server admin to whitelist it.")
	}

	opaque := make([]byte, 64)
	_, err = rand.Read(opaque)
	if err != nil {
		return err
	}

	_, err = h.db.CreateOidcLogin(ctx, dbc.CreateOidcLoginParams{
		Provider:    provider.Id,
		Opaque:      base64.RawURLEncoding.EncodeToString(opaque),
		RedirectUrl: redirectURL,
		Tenant:      c.QueryParam("tenant"),
	})
	if err != nil {
		return err
	}

	authURL, err := url.Parse(provider.Authorization)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "Invalid OIDC authorization URL")
	}
	params := authURL.Query()
	params.Set("response_type", "code")
	params.Set("client_id", provider.ClientId)
	params.Set("scope", provider.Scope)
	params.Set("redirect_uri", fmt.Sprintf(
		"%s/auth/oidc/logged/%s",
		strings.TrimSuffix(h.config.PublicUrl, "/"),
		provider.Id,
	))
	params.Set("state", base64.RawURLEncoding.EncodeToString(opaque))
	authURL.RawQuery = params.Encode()

	go h.db.CleanupOidcLogins(ctx)
	return c.Redirect(http.StatusFound, authURL.String())
}

// @Summary      OIDC logged callback
// @Description  Callback endpoint called by OIDC providers after login.
// @Tags         oidc
// @Produce      json
// @Param        provider  path   string  true  "OIDC provider id"  Example(google)
// @Param        state     query  string  true  "State value returned by the provider"
// @Param        code      query  string  false "Authorization code"
// @Param        error     query  string  false "Provider callback error"
// @Success      302
// @Failure      400  {object}  KError "Invalid state"
// @Failure      404  {object}  KError "Unknown OIDC provider"
// @Router /oidc/logged/{provider} [get]
func (h *Handler) OidcLogged(c *echo.Context) error {
	ctx := c.Request().Context()
	provider, err := h.getOidcProvider(c.Param("provider"))
	if err != nil {
		return err
	}

	login, err := h.db.GetOidcLoginByOpaque(ctx, dbc.GetOidcLoginByOpaqueParams{
		Opaque:   c.QueryParam("state"),
		Provider: provider.Id,
	})
	if err == pgx.ErrNoRows {
		return echo.NewHTTPError(http.StatusNotFound, "Login state not found or expired.")
	} else if err != nil {
		return err
	}

	if login.CreatedAt.Add(time.Hour).Compare(time.Now().UTC()) < 0 {
		return echo.NewHTTPError(http.StatusGone, "Login state expired")
	}

	providerErr := c.QueryParam("error")
	if providerErr != "" {
		h.db.DeleteOidcLoginById(ctx, login.Id)
	} else {
		err = h.db.SaveOidcLoginCode(ctx, dbc.SaveOidcLoginCodeParams{
			Id:   login.Id,
			Code: new(c.QueryParam("code")),
		})
		if err != nil {
			return err
		}
	}

	ret, err := url.Parse(login.RedirectUrl)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "Invalid OIDC redirect URL")
	}
	params := ret.Query()
	params.Set("provider", provider.Id)
	params.Set("token", login.Opaque)
	params.Set("error", providerErr)
	ret.RawQuery = params.Encode()
	return c.Redirect(http.StatusFound, ret.String())
}

// @Summary      OIDC callback
// @Description  Exchange an opaque OIDC token for a local session.
// @Tags         oidc
// @Produce      json
// @Param        provider      path   string  true   "OIDC provider id"  Example(google)
// @Param        token         query  string  true   "Opaque token returned by /oidc/logged/:provider"
// @Param        tenant        query  string  false  "Optional tenant passthrough for federated setups"
// @Param        device        query  string  false  "The device the created session will be used on"  example(android tv)
// @Param        Authorization header string  false  "Bearer token to link provider to current account"
// @Success      201  {object}  SessionWToken
// @Failure      404  {object}  KError "Unknown OIDC provider"
// @Failure      410  {object}  KError "Login token expired or already used"
// @Router /oidc/callback/{provider} [get]
func (h *Handler) OidcCallback(c *echo.Context) error {
	ctx := c.Request().Context()
	provider, err := h.getOidcProvider(c.Param("provider"))
	if err != nil {
		return err
	}

	login, err := h.db.ConsumeOidcLogin(ctx, dbc.ConsumeOidcLoginParams{
		Opaque:   c.QueryParam("token"),
		Provider: provider.Id,
		Tenant:   c.QueryParam("tenant"),
	})
	if err == pgx.ErrNoRows {
		return echo.NewHTTPError(http.StatusGone, "Login token expired or already used")
	} else if err != nil {
		return err
	}

	if login.Code == nil || *login.Code == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "Missing authorization code")
	}

	token, err := h.exchangeOidcCode(c, provider, *login.Code)
	if err != nil {
		return err
	}
	profile, err := h.fetchOidcProfile(c, provider, token.AccessToken)
	if err != nil {
		return err
	}

	if uid, err := GetCurrentUserId(c); err == nil {
		return h.LinkOidcTo(c, provider, profile, token, uid)
	}
	return h.CreateUserByOidc(c, provider, profile, token)
}

type Token struct {
	AccessToken  string  `json:"access_token"`
	RefreshToken *string `json:"refresh_token"`
	ExpiresIn    float64 `json:"expires_in"`
}

func (h *Handler) exchangeOidcCode(c *echo.Context, provider OidcProviderConfig, code string) (Token, error) {
	redirectURI := fmt.Sprintf(
		"%s/auth/oidc/logged/%s",
		strings.TrimSuffix(h.config.PublicUrl, "/"),
		provider.Id,
	)
	body := url.Values{}
	body.Set("grant_type", "authorization_code")
	body.Set("code", code)
	body.Set("redirect_uri", redirectURI)

	if provider.AuthMethod == OidcClientSecretPost {
		body.Set("client_id", provider.ClientId)
		body.Set("client_secret", provider.Secret)
	}

	req, err := http.NewRequestWithContext(
		c.Request().Context(),
		http.MethodPost,
		provider.Token,
		strings.NewReader(body.Encode()),
	)
	if err != nil {
		return Token{}, err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Set("Accept", "application/json")

	if provider.AuthMethod == OidcClientSecretBasic {
		basic := base64.StdEncoding.EncodeToString(
			fmt.Appendf(nil, "%s:%s", provider.ClientId, provider.Secret),
		)
		req.Header.Set("Authorization", "Basic "+basic)
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		slog.Error("Error calling oidc token endpoint: %v", "err", err)
		return Token{}, echo.NewHTTPError(http.StatusBadGateway, "Could not reach OIDC token endpoint")
	}
	defer resp.Body.Close()
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		slog.Error("Error on oidc token endpoint: %v", "err", err)
		return Token{}, echo.NewHTTPError(http.StatusBadGateway, "OIDC token exchange failed")
	}

	var ret Token
	if err := json.NewDecoder(resp.Body).Decode(&ret); err != nil {
		slog.Error("Couldn't decode token: %v", "err", err)
		return Token{}, echo.NewHTTPError(http.StatusBadGateway, "Invalid OIDC token response")
	}
	return ret, nil
}

type RawProfile struct {
	Sub               *string        `json:"sub"`
	Uid               *string        `json:"uid"`
	Id                *string        `json:"id"`
	Guid              *string        `json:"guid"`
	Picture           *string        `json:"picture"`
	AvatarURL         *string        `json:"avatar_url"`
	Avatar            *string        `json:"avatar"`
	Username          *string        `json:"username"`
	PreferredUsername *string        `json:"preferred_username"`
	Login             *string        `json:"login"`
	Name              *string        `json:"name"`
	Nickname          *string        `json:"nickname"`
	Email             *string        `json:"email"`
	Account           map[string]any `json:"account"`
	User              map[string]any `json:"user"`
}

type Profile struct {
	Sub        string `json:"sub,omitempty"`
	Username   string `json:"username,omitempty"`
	Email      string `json:"email,omitempty"`
	PictureURL string `json:"pictureUrl,omitempty"`
}

func (h *Handler) fetchOidcProfile(c *echo.Context, provider OidcProviderConfig, accessToken string) (Profile, error) {
	req, err := http.NewRequestWithContext(c.Request().Context(), http.MethodGet, provider.Profile, nil)
	if err != nil {
		return Profile{}, err
	}
	req.Header.Set("Authorization", "Bearer "+accessToken)
	req.Header.Set("Accept", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		slog.Error("Error calling oidc profile endpoint: %v", "err", err)
		return Profile{}, echo.NewHTTPError(http.StatusInternalServerError, "Could not reach OIDC profile endpoint")
	}
	defer resp.Body.Close()

	var profile RawProfile
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		slog.Error("Error on oidc profile endpoint: %v", "err", err)
		return Profile{}, echo.NewHTTPError(http.StatusInternalServerError, "Could not fetch OIDC profile")
	}
	if err := json.NewDecoder(resp.Body).Decode(&profile); err != nil {
		slog.Error("Error parsing oidc profile: %v", "err", err)
		return Profile{}, echo.NewHTTPError(http.StatusInternalServerError, "Invalid OIDC profile response")
	}
	sub := cmp.Or(profile.Sub, profile.Uid, profile.Id, profile.Guid)
	if sub == nil {
		if id, ok := profile.Account["id"]; ok {
			if sid, ok := id.(string); ok {
				sub = new(sid)
			}
		}
	}
	if sub == nil {
		return Profile{}, echo.NewHTTPError(http.StatusInternalServerError, "Missing sub or username")
	}
	picture := cmp.Or(profile.Picture, profile.AvatarURL, profile.Avatar)
	if picture == nil {
		if rawPicture, ok := profile.Account["picture"]; ok {
			if pictureURL, ok := rawPicture.(string); ok {
				picture = &pictureURL
			}
		}
	}
	if picture == nil {
		if rawPicture, ok := profile.User["picture"]; ok {
			if pictureURL, ok := rawPicture.(string); ok {
				picture = &pictureURL
			}
		}
	}
	pictureURL := ""
	if picture != nil {
		pictureURL = *picture
	}
	return Profile{
		Sub: *sub,
		Username: *cmp.Or(
			profile.Username,
			profile.PreferredUsername,
			profile.Nickname,
			profile.Name,
			profile.Login,
			new(fmt.Sprintf("%s-%s", provider.Id, *sub)),
		),
		Email: *cmp.Or(profile.Email, new(fmt.Sprintf(
			"%s@%s.local",
			*sub,
			provider,
		))),
		PictureURL: pictureURL,
	}, nil
}

func (h *Handler) LinkOidcTo(
	c *echo.Context,
	provider OidcProviderConfig,
	profile Profile,
	token Token,
	uid uuid.UUID,
) error {
	ctx := c.Request().Context()
	existing, err := h.db.GetUserByOidc(ctx, dbc.GetUserByOidcParams{
		Provider: provider.Id,
		Id:       profile.Sub,
	})
	if err == nil && existing.Id != uid {
		return echo.NewHTTPError(http.StatusConflict, "This OIDC account is already linked to another user")
	}
	if err != nil && err != pgx.ErrNoRows {
		return err
	}

	var expireAt *time.Time
	if token.ExpiresIn > 0 {
		expireAt = new(time.Now().UTC().Add(time.Duration(token.ExpiresIn * float64(time.Second))))
	}

	dbuser, err := h.db.GetUser(ctx, dbc.GetUserParams{
		UseId: true,
		Id:    uid,
	})
	if err != nil {
		return err
	}

	err = h.db.UpsertOidcHandle(ctx, dbc.UpsertOidcHandleParams{
		UserPk:       dbuser.User.Pk,
		Provider:     provider.Id,
		Id:           profile.Sub,
		Username:     profile.Username,
		ProfileUrl:   nil,
		AccessToken:  new(token.AccessToken),
		RefreshToken: token.RefreshToken,
		ExpireAt:     expireAt,
	})
	if err != nil {
		return err
	}
	ret := MapDbUser(&dbuser.User)
	ret.Oidc = dbuser.Oidc
	ret.Oidc[provider.Id] = models.OidcHandle{
		Id:         profile.Sub,
		Username:   profile.Username,
		ProfileUrl: nil,
	}
	return c.JSON(http.StatusOK, ret)
}

func (h *Handler) CreateUserByOidc(
	c *echo.Context,
	provider OidcProviderConfig,
	profile Profile,
	token Token,
) error {
	ctx := c.Request().Context()

	user, err := h.db.GetUserByOidc(ctx, dbc.GetUserByOidcParams{
		Provider: provider.Id,
		Id:       profile.Sub,
	})
	if err != nil {
		if err != pgx.ErrNoRows {
			return err
		}

		username := strings.ReplaceAll(profile.Username, "@", "-")
		if len(username) > 256 {
			username = username[:256]
		}

		user, err = h.db.CreateUser(ctx, dbc.CreateUserParams{
			Username:    username,
			Email:       profile.Email,
			Password:    nil,
			Claims:      h.config.DefaultClaims,
			FirstClaims: h.config.FirstUserClaims,
		})
		if ErrIs(err, pgerrcode.UniqueViolation) {
			return echo.NewHTTPError(http.StatusConflict, "A user already exists with the same username or email. If this is you, login via username and then link your account.")
		}
		if err != nil {
			return err
		}

		if profile.PictureURL != "" {
			if err := h.downloadLogo(ctx, user.Id, profile.PictureURL); err != nil {
				slog.Warn(
					"Could not download OIDC profile picture",
					"provider",
					provider.Id,
					"sub",
					profile.Sub,
					"err",
					err,
				)
			}
		}

	}

	var expireAt *time.Time
	if token.ExpiresIn > 0 {
		expireAt = new(time.Now().UTC().Add(time.Duration(token.ExpiresIn * float64(time.Second))))
	}

	err = h.db.UpsertOidcHandle(ctx, dbc.UpsertOidcHandleParams{
		UserPk:       user.Pk,
		Provider:     provider.Id,
		Id:           profile.Sub,
		Username:     profile.Username,
		ProfileUrl:   nil,
		AccessToken:  &token.AccessToken,
		RefreshToken: token.RefreshToken,
		ExpireAt:     expireAt,
	})
	if err != nil {
		return err
	}

	return h.createSession(c, new(MapDbUser(&user)))
}

// @Summary      OIDC unlink provider
// @Description  Remove an OIDC provider from the current account.
// @Tags         oidc
// @Produce      json
// @Security     Jwt
// @Param        provider  path  string  true  "OIDC provider id"  Example(google)
// @Success      204
// @Failure      404  {object}  KError "Unknown OIDC provider"
// @Router /oidc/login/{provider} [delete]
func (h *Handler) OidcUnlink(c *echo.Context) error {
	providerName := strings.ToLower(c.Param("provider"))
	_, err := h.getOidcProvider(providerName)
	if err != nil {
		return err
	}

	uid, err := GetCurrentUserId(c)
	if err != nil {
		return err
	}
	ctx := c.Request().Context()

	user, err := h.db.GetUser(ctx, dbc.GetUserParams{UseId: true, Id: uid})
	if err == pgx.ErrNoRows {
		return echo.NewHTTPError(http.StatusNotFound, "No user found")
	} else if err != nil {
		return nil
	}
	if user.User.Password == nil {
		return echo.NewHTTPError(http.StatusUnprocessableEntity, "You must configure a password before unlinking your OIDC provider")
	}

	err = h.db.DeleteOidcHandle(ctx, dbc.DeleteOidcHandleParams{
		UserPk:   user.User.Pk,
		Provider: providerName,
	})
	if err != nil {
		return err
	}
	return c.NoContent(http.StatusNoContent)
}

type ServerInfo struct {
	PublicUrl     string              `json:"publicUrl"`
	AllowRegister bool                `json:"allowRegister"`
	Oidc          map[string]OidcInfo `json:"oidc"`
}

type OidcInfo struct {
	Name string `json:"name"`
	Logo string `json:"logo"`
}

// @Summary      Auth info
// @Description  List keibi's settings (oidc providers, public url...)
// @Tags         oidc
// @Produce      json
// @Success      200  {object}  ServerInfo
// @Router /info [get]
func (h *Handler) Info(c *echo.Context) error {
	ret := ServerInfo{
		PublicUrl:     h.config.PublicUrl,
		AllowRegister: !h.config.DisableRegistration,
		Oidc:          make(map[string]OidcInfo),
	}
	for _, provider := range h.config.OidcProviders {
		ret.Oidc[provider.Id] = OidcInfo{
			Name: provider.Name,
			Logo: provider.Logo,
		}
	}
	return c.JSON(http.StatusOK, ret)
}
