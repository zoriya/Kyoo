package main

import (
	"cmp"
	"context"
	"crypto"
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"encoding/base64"
	"encoding/json"
	"encoding/pem"
	"fmt"
	"maps"
	"net/url"
	"os"
	"slices"
	"strconv"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/lestrrat-go/jwx/v4/jwk"
	"github.com/zoriya/kyoo/keibi/dbc"
)

type Configuration struct {
	JwtPrivateKey       *rsa.PrivateKey
	JwtPublicKey        *rsa.PublicKey
	JwtKid              string
	PublicUrl           string
	OidcProviders       map[string]OidcProviderConfig
	OidcRedirectUrls    []OidcRedirectRule
	DefaultClaims       jwt.MapClaims
	FirstUserClaims     jwt.MapClaims
	GuestClaims         jwt.MapClaims
	ProtectedClaims     []string
	ExpirationDelay     time.Duration
	EnvApiKeys          []ApiKeyWToken
	ProfilePicturePath  string
	DisableRegistration bool
}

type OidcAuthMethod string

const (
	OidcClientSecretBasic OidcAuthMethod = "ClientSecretBasic"
	OidcClientSecretPost  OidcAuthMethod = "ClientSecretPost"
)

type OidcRedirectRule struct {
	Scheme string
	Host   string
}

type OidcProviderConfig struct {
	Id            string
	Name          string
	Logo          string
	ClientId      string
	Secret        string
	Authorization string
	Token         string
	Profile       string
	Scope         string
	AuthMethod    OidcAuthMethod
}

var DefaultConfig = Configuration{
	DefaultClaims:    make(jwt.MapClaims),
	FirstUserClaims:  make(jwt.MapClaims),
	OidcProviders:    make(map[string]OidcProviderConfig),
	OidcRedirectUrls: make([]OidcRedirectRule, 0),
	ProtectedClaims:  []string{"permissions"},
	ExpirationDelay:  30 * 24 * time.Hour,
	EnvApiKeys:       make([]ApiKeyWToken, 0),
}

func LoadConfiguration(ctx context.Context, db *dbc.Queries) (*Configuration, error) {
	ret := DefaultConfig

	ret.PublicUrl = os.Getenv("PUBLIC_URL")
	ret.ProfilePicturePath = cmp.Or(
		os.Getenv("PROFILE_PICTURE_PATH"),
		"/profile_pictures",
	)

	pub, err := url.Parse(ret.PublicUrl)
	if err != nil {
		return nil, fmt.Errorf("invalid PUBLIC_URL: %w", err)
	}
	if pub.Host != "" {
		ret.OidcRedirectUrls = append(ret.OidcRedirectUrls, OidcRedirectRule{
			Scheme: pub.Scheme,
			Host:   pub.Host,
		})
	}
	for entry := range strings.SplitSeq(os.Getenv("EXTRA_OIDC_REDIRECT_URLS"), ",") {
		entry = strings.TrimSpace(entry)
		if entry == "" {
			continue
		}
		u, err := url.Parse(entry)
		if err != nil {
			return nil, fmt.Errorf("invalid EXTRA_OIDC_REDIRECT_URLS entry %q: %w", entry, err)
		}
		if u.Scheme == "" {
			ret.OidcRedirectUrls = append(ret.OidcRedirectUrls, OidcRedirectRule{
				Scheme: strings.TrimSuffix(entry, ":"),
			})
		} else {
			ret.OidcRedirectUrls = append(ret.OidcRedirectUrls, OidcRedirectRule{
				Scheme: u.Scheme,
				Host:   u.Host,
			})
		}
	}

	disableRegistration, err := strconv.ParseBool(cmp.Or(os.Getenv("DISABLE_REGISTRATION"), "false"))
	if err != nil {
		return nil, fmt.Errorf("invalid DISABLE_REGISTRATION value: %w", err)
	}
	ret.DisableRegistration = disableRegistration

	claims := os.Getenv("EXTRA_CLAIMS")
	if claims != "" {
		err := json.Unmarshal([]byte(claims), &ret.DefaultClaims)
		if err != nil {
			return nil, err
		}
	}
	maps.Insert(ret.FirstUserClaims, maps.All(ret.DefaultClaims))
	claims = os.Getenv("FIRST_USER_CLAIMS")
	if claims != "" {
		err := json.Unmarshal([]byte(claims), &ret.FirstUserClaims)
		if err != nil {
			return nil, err
		}
	} else {
		ret.FirstUserClaims = ret.DefaultClaims
	}

	claims = os.Getenv("GUEST_CLAIMS")
	if claims != "" {
		err := json.Unmarshal([]byte(claims), &ret.GuestClaims)
		if err != nil {
			return nil, err
		}
	}

	protected := strings.Split(os.Getenv("PROTECTED_CLAIMS"), ",")
	ret.ProtectedClaims = append(ret.ProtectedClaims, protected...)

	rsa_pk_path := os.Getenv("RSA_PRIVATE_KEY_PATH")
	if rsa_pk_path != "" {
		privateKeyData, err := os.ReadFile(rsa_pk_path)
		if err != nil {
			return nil, err
		}

		block, _ := pem.Decode(privateKeyData)
		if block == nil || block.Type != "RSA PRIVATE KEY" {
			return nil, err
		}

		ret.JwtPrivateKey, err = x509.ParsePKCS1PrivateKey(block.Bytes)
		if err != nil {
			pkcs8Key, err := x509.ParsePKCS8PrivateKey(block.Bytes)
			if err != nil {
				return nil, err
			}
			ret.JwtPrivateKey = pkcs8Key.(*rsa.PrivateKey)
		}
	} else {
		var err error
		ret.JwtPrivateKey, err = rsa.GenerateKey(rand.Reader, 4096)
		if err != nil {
			return nil, err
		}
	}
	ret.JwtPublicKey = &ret.JwtPrivateKey.PublicKey
	key, err := jwk.Import(ret.JwtPublicKey)
	if err != nil {
		return nil, err
	}
	thumbprint, err := key.Thumbprint(crypto.SHA256)
	if err != nil {
		return nil, err
	}
	ret.JwtKid = base64.RawStdEncoding.EncodeToString(thumbprint)

	for _, env := range os.Environ() {
		if !strings.HasPrefix(env, "KEIBI_APIKEY_") {
			continue
		}
		v := strings.Split(env, "=")
		if strings.HasSuffix(v[0], "_CLAIMS") {
			continue
		}

		name := strings.TrimPrefix(v[0], "KEIBI_APIKEY_")
		cstr := os.Getenv(fmt.Sprintf("KEIBI_APIKEY_%s_CLAIMS", name))

		var claims jwt.MapClaims
		if cstr != "" {
			err := json.Unmarshal([]byte(cstr), &claims)
			if err != nil {
				return nil, err
			}
		} else {
			return nil, fmt.Errorf("missing claims env var KEIBI_APIKEY_%s_CLAIMS", name)
		}

		name = strings.ToLower(name)
		ret.EnvApiKeys = append(ret.EnvApiKeys, ApiKeyWToken{
			ApiKey: ApiKey{
				Id:     uuid.New(),
				Name:   name,
				Claims: claims,
			},
			Token: v[1],
		})

	}
	apikeys, err := db.ListApiKeys(ctx)
	if err != nil {
		return nil, err
	}
	for _, key := range apikeys {
		dup := slices.ContainsFunc(ret.EnvApiKeys, func(k ApiKeyWToken) bool {
			return k.Name == key.Name
		})
		if dup {
			return nil, fmt.Errorf(
				"an api key with the name %s is already defined in database. Can't specify a new one via env var",
				key.Name,
			)
		}
	}

	oidcProviders := make([]string, 0)
	for _, env := range os.Environ() {
		parts := strings.SplitN(env, "=", 2)
		if len(parts) != 2 {
			continue
		}
		k := parts[0]
		if !strings.HasPrefix(k, "OIDC_") || !strings.HasSuffix(k, "_CLIENTID") {
			continue
		}
		name := strings.TrimSuffix(strings.TrimPrefix(k, "OIDC_"), "_CLIENTID")
		if name == "" {
			continue
		}
		oidcProviders = append(oidcProviders, name)
	}

	for _, name := range oidcProviders {
		providerId := strings.ToLower(name)
		provider := OidcProviderConfig{
			Id:            providerId,
			Name:          os.Getenv(fmt.Sprintf("OIDC_%s_NAME", name)),
			Logo:          os.Getenv(fmt.Sprintf("OIDC_%s_LOGO", name)),
			ClientId:      os.Getenv(fmt.Sprintf("OIDC_%s_CLIENTID", name)),
			Secret:        os.Getenv(fmt.Sprintf("OIDC_%s_SECRET", name)),
			Authorization: os.Getenv(fmt.Sprintf("OIDC_%s_AUTHORIZATION", name)),
			Token:         os.Getenv(fmt.Sprintf("OIDC_%s_TOKEN", name)),
			Profile:       os.Getenv(fmt.Sprintf("OIDC_%s_PROFILE", name)),
			Scope:         os.Getenv(fmt.Sprintf("OIDC_%s_SCOPE", name)),
			AuthMethod:    OidcClientSecretBasic,
		}

		authMethod := os.Getenv(fmt.Sprintf("OIDC_%s_AUTHMETHOD", name))
		if authMethod != "" {
			switch OidcAuthMethod(authMethod) {
			case OidcClientSecretBasic, OidcClientSecretPost:
				provider.AuthMethod = OidcAuthMethod(authMethod)
			default:
				return nil, fmt.Errorf("invalid OIDC_%s_AUTHMETHOD: %s", name, authMethod)
			}
		}

		if provider.Name == "" {
			provider.Name = name
		}
		var missing []string
		if provider.ClientId == "" {
			missing = append(missing, fmt.Sprintf("OIDC_%s_CLIENTID", name))
		}
		if provider.Secret == "" {
			missing = append(missing, fmt.Sprintf("OIDC_%s_SECRET", name))
		}
		if provider.Authorization == "" {
			missing = append(missing, fmt.Sprintf("OIDC_%s_AUTHORIZATION", name))
		}
		if provider.Token == "" {
			missing = append(missing, fmt.Sprintf("OIDC_%s_TOKEN", name))
		}
		if provider.Profile == "" {
			missing = append(missing, fmt.Sprintf("OIDC_%s_PROFILE", name))
		}
		if len(missing) > 0 {
			return nil, fmt.Errorf("invalid oidc configuration for provider %s, missing required values: %s", providerId, strings.Join(missing, ", "))
		}
		if provider.Scope == "" {
			provider.Scope = "openid profile email"
		}

		ret.OidcProviders[providerId] = provider
	}

	return &ret, nil
}
