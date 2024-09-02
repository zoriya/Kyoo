package main

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/zoriya/kyoo/keibi/dbc"
)

type Configuration struct {
	JwtSecret     []byte
	Issuer        string
	DefaultClaims jwt.MapClaims
	ExpirationDelay time.Duration
}

const (
	JwtSecret = "jwt_secret"
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
		case JwtSecret:
			secret, err := base64.StdEncoding.DecodeString(conf.Value)
			if err != nil {
				return nil, err
			}
			ret.JwtSecret = secret
		}
	}

	if ret.JwtSecret == nil {
		ret.JwtSecret = make([]byte, 128)
		rand.Read(ret.JwtSecret)

		_, err := db.SaveConfig(ctx, dbc.SaveConfigParams{
			Key:   JwtSecret,
			Value: base64.StdEncoding.EncodeToString(ret.JwtSecret),
		})
		if err != nil {
			return nil, err
		}
	}

	return &ret, nil
}
