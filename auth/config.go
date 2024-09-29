package main

import (
	"context"
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"encoding/pem"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/zoriya/kyoo/keibi/dbc"
)

type Configuration struct {
	JwtPrivateKey   *rsa.PrivateKey
	JwtPublicKey    *rsa.PublicKey
	Issuer          string
	DefaultClaims   jwt.MapClaims
	ExpirationDelay time.Duration
}

const (
	JwtPrivateKey = "jwt_private_key"
)

func LoadConfiguration(db *dbc.Queries) (*Configuration, error) {
	ctx := context.Background()
	confs, err := db.LoadConfig(ctx)
	if err != nil {
		return nil, err
	}

	ret := Configuration{}

	for _, conf := range confs {
		switch conf.Key {
		case JwtPrivateKey:
			block, _ := pem.Decode([]byte(conf.Value))
			key, err := x509.ParsePKCS1PrivateKey(block.Bytes)
			if err != nil {
				return nil, err
			}
			ret.JwtPrivateKey = key
			ret.JwtPublicKey = &key.PublicKey
		}
	}

	if ret.JwtPrivateKey == nil {
		ret.JwtPrivateKey, err = rsa.GenerateKey(rand.Reader, 4096)
		if err != nil {
			return nil, err
		}
		ret.JwtPublicKey = &ret.JwtPrivateKey.PublicKey

		pemd := pem.EncodeToMemory(
			&pem.Block{
				Type:  "RSA PRIVATE KEY",
				Bytes: x509.MarshalPKCS1PrivateKey(ret.JwtPrivateKey),
			},
		)

		_, err := db.SaveConfig(ctx, dbc.SaveConfigParams{
			Key:   JwtPrivateKey,
			Value: string(pemd),
		})
		if err != nil {
			return nil, err
		}
	}

	return &ret, nil
}
