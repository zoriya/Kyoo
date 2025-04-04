package main

import "net/url"

type Page[T any] struct {
	Items []T     `json:"items"`
	This  string  `json:"this" example:"https://kyoo.zoriya.dev/auth/users"`
	Next  *string `json:"next" example:"https://kyoo.zoriya.dev/auth/users?after=aoeusth"`
}

func NewPage(items []User, url *url.URL, limit int32) Page[User] {
	this := url.String()

	var next *string
	if len(items) == int(limit) && limit > 0 {
		query := url.Query()
		query.Set("after", items[len(items)-1].Id.String())
		url.RawQuery = query.Encode()
		nextU := url.String()
		next = &nextU
	}

	return Page[User]{
		Items: items,
		This:  this,
		Next:  next,
	}
}
