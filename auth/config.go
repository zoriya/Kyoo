package main

import (
	"context"
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"encoding/pem"
	"os"
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
	ExpirationDelay time.Duration
}

var DefaultConfig = Configuration{
	DefaultClaims:   make(jwt.MapClaims),
	ExpirationDelay: 30 * 24 * time.Hour,
}

func LoadConfiguration(db *dbc.Queries) (*Configuration, error) {
	ret := DefaultConfig

	ret.PublicUrl = os.Getenv("PUBLIC_URL")
	ret.Prefix = os.Getenv("KEIBI_PREFIX")

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
