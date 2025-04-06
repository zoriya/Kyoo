package main

import (
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"encoding/json"
	"encoding/pem"
	"maps"
	"os"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/zoriya/kyoo/keibi/dbc"
)

type Configuration struct {
	Prefix          string
	JwtPrivateKey   *rsa.PrivateKey
	JwtPublicKey    *rsa.PublicKey
	PublicUrl       string
	DefaultClaims   jwt.MapClaims
	FirstUserClaims jwt.MapClaims
	GuestClaims     jwt.MapClaims
	ProtectedClaims []string
	ExpirationDelay time.Duration
}

var DefaultConfig = Configuration{
	DefaultClaims:   make(jwt.MapClaims),
	FirstUserClaims: make(jwt.MapClaims),
	ProtectedClaims: []string{"permissions"},
	ExpirationDelay: 30 * 24 * time.Hour,
}

func LoadConfiguration(db *dbc.Queries) (*Configuration, error) {
	ret := DefaultConfig

	ret.PublicUrl = os.Getenv("PUBLIC_URL")
	ret.Prefix = os.Getenv("KEIBI_PREFIX")

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
		ret.JwtPublicKey = &ret.JwtPrivateKey.PublicKey
	}

	return &ret, nil
}
