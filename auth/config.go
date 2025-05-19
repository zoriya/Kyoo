package main

import (
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
	"os"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/lestrrat-go/jwx/v3/jwk"
	"github.com/zoriya/kyoo/keibi/dbc"
)

type Configuration struct {
	JwtPrivateKey   *rsa.PrivateKey
	JwtPublicKey    *rsa.PublicKey
	JwtKid          string
	PublicUrl       string
	DefaultClaims   jwt.MapClaims
	FirstUserClaims jwt.MapClaims
	GuestClaims     jwt.MapClaims
	ProtectedClaims []string
	ExpirationDelay time.Duration
	EnvApiKeys      map[string]ApiKeyWToken
}

var DefaultConfig = Configuration{
	DefaultClaims:   make(jwt.MapClaims),
	FirstUserClaims: make(jwt.MapClaims),
	ProtectedClaims: []string{"permissions"},
	ExpirationDelay: 30 * 24 * time.Hour,
	EnvApiKeys:      make(map[string]ApiKeyWToken),
}

func LoadConfiguration(db *dbc.Queries) (*Configuration, error) {
	ret := DefaultConfig

	ret.PublicUrl = os.Getenv("PUBLIC_URL")

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
		ret.EnvApiKeys[name] = ApiKeyWToken{
			ApiKey: ApiKey{
				Id:     uuid.New(),
				Name:   name,
				Claims: claims,
			},
			Token: v[1],
		}

	}
	apikeys, err := db.ListApiKeys(context.Background())
	if err != nil {
		return nil, err
	}
	for _, key := range apikeys {
		if _, defined := ret.EnvApiKeys[key.Name]; defined {
			return nil, fmt.Errorf(
				"an api key with the name %s is already defined in database. Can't specify a new one via env var",
				key.Name,
			)
		}
	}

	return &ret, nil
}
