package main

type Configuration struct {
	JwtSecret string
	DefaultClaims []byte
}
