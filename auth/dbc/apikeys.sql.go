// Code generated by sqlc. DO NOT EDIT.
// versions:
//   sqlc v1.28.0
// source: apikeys.sql

package dbc

import (
	"context"

	jwt "github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

const createApiKey = `-- name: CreateApiKey :one
insert into apikeys(name, token, claims, created_by)
	values ($1, $2, $3, $4)
returning
	pk, id, name, token, claims, created_by, created_at, last_used
`

type CreateApiKeyParams struct {
	Name      string        `json:"name"`
	Token     string        `json:"token"`
	Claims    jwt.MapClaims `json:"claims"`
	CreatedBy *int32        `json:"createdBy"`
}

func (q *Queries) CreateApiKey(ctx context.Context, arg CreateApiKeyParams) (Apikey, error) {
	row := q.db.QueryRow(ctx, createApiKey,
		arg.Name,
		arg.Token,
		arg.Claims,
		arg.CreatedBy,
	)
	var i Apikey
	err := row.Scan(
		&i.Pk,
		&i.Id,
		&i.Name,
		&i.Token,
		&i.Claims,
		&i.CreatedBy,
		&i.CreatedAt,
		&i.LastUsed,
	)
	return i, err
}

const deleteApiKey = `-- name: DeleteApiKey :one
delete from apikeys
where id = $1
returning
	pk, id, name, token, claims, created_by, created_at, last_used
`

func (q *Queries) DeleteApiKey(ctx context.Context, id uuid.UUID) (Apikey, error) {
	row := q.db.QueryRow(ctx, deleteApiKey, id)
	var i Apikey
	err := row.Scan(
		&i.Pk,
		&i.Id,
		&i.Name,
		&i.Token,
		&i.Claims,
		&i.CreatedBy,
		&i.CreatedAt,
		&i.LastUsed,
	)
	return i, err
}

const getApiKey = `-- name: GetApiKey :one
select
	pk, id, name, token, claims, created_by, created_at, last_used
from
	apikeys
where
	name = $1
	and token = $2
`

type GetApiKeyParams struct {
	Name  string `json:"name"`
	Token string `json:"token"`
}

func (q *Queries) GetApiKey(ctx context.Context, arg GetApiKeyParams) (Apikey, error) {
	row := q.db.QueryRow(ctx, getApiKey, arg.Name, arg.Token)
	var i Apikey
	err := row.Scan(
		&i.Pk,
		&i.Id,
		&i.Name,
		&i.Token,
		&i.Claims,
		&i.CreatedBy,
		&i.CreatedAt,
		&i.LastUsed,
	)
	return i, err
}

const listApiKeys = `-- name: ListApiKeys :many
select
	pk, id, name, token, claims, created_by, created_at, last_used
from
	apikeys
order by
	last_used
`

func (q *Queries) ListApiKeys(ctx context.Context) ([]Apikey, error) {
	rows, err := q.db.Query(ctx, listApiKeys)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []Apikey
	for rows.Next() {
		var i Apikey
		if err := rows.Scan(
			&i.Pk,
			&i.Id,
			&i.Name,
			&i.Token,
			&i.Claims,
			&i.CreatedBy,
			&i.CreatedAt,
			&i.LastUsed,
		); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return items, nil
}

const touchApiKey = `-- name: TouchApiKey :exec
update
	apikeys
set
	last_used = now()::timestamptz
where
	pk = $1
`

func (q *Queries) TouchApiKey(ctx context.Context, pk int32) error {
	_, err := q.db.Exec(ctx, touchApiKey, pk)
	return err
}
