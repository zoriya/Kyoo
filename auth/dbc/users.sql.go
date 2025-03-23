// Code generated by sqlc. DO NOT EDIT.
// versions:
//   sqlc v1.28.0
// source: users.sql

package dbc

import (
	"context"

	jwt "github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

const createUser = `-- name: CreateUser :one
insert into users(username, email, password, claims)
	values ($1, $2, $3, $4)
returning
	pk, id, username, email, password, claims, created_date, last_seen
`

type CreateUserParams struct {
	Username string        `json:"username"`
	Email    string        `json:"email"`
	Password *string       `json:"password"`
	Claims   jwt.MapClaims `json:"claims"`
}

func (q *Queries) CreateUser(ctx context.Context, arg CreateUserParams) (User, error) {
	row := q.db.QueryRow(ctx, createUser,
		arg.Username,
		arg.Email,
		arg.Password,
		arg.Claims,
	)
	var i User
	err := row.Scan(
		&i.Pk,
		&i.Id,
		&i.Username,
		&i.Email,
		&i.Password,
		&i.Claims,
		&i.CreatedDate,
		&i.LastSeen,
	)
	return i, err
}

const deleteUser = `-- name: DeleteUser :one
delete from users
where id = $1
returning
	pk, id, username, email, password, claims, created_date, last_seen
`

func (q *Queries) DeleteUser(ctx context.Context, id uuid.UUID) (User, error) {
	row := q.db.QueryRow(ctx, deleteUser, id)
	var i User
	err := row.Scan(
		&i.Pk,
		&i.Id,
		&i.Username,
		&i.Email,
		&i.Password,
		&i.Claims,
		&i.CreatedDate,
		&i.LastSeen,
	)
	return i, err
}

const getAllUsers = `-- name: GetAllUsers :many
select
	pk, id, username, email, password, claims, created_date, last_seen
from
	users
order by
	id
limit $1
`

func (q *Queries) GetAllUsers(ctx context.Context, limit int32) ([]User, error) {
	rows, err := q.db.Query(ctx, getAllUsers, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []User
	for rows.Next() {
		var i User
		if err := rows.Scan(
			&i.Pk,
			&i.Id,
			&i.Username,
			&i.Email,
			&i.Password,
			&i.Claims,
			&i.CreatedDate,
			&i.LastSeen,
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

const getAllUsersAfter = `-- name: GetAllUsersAfter :many
select
	pk, id, username, email, password, claims, created_date, last_seen
from
	users
where
	id >= $2
order by
	id
limit $1
`

type GetAllUsersAfterParams struct {
	Limit   int32     `json:"limit"`
	AfterId uuid.UUID `json:"afterId"`
}

func (q *Queries) GetAllUsersAfter(ctx context.Context, arg GetAllUsersAfterParams) ([]User, error) {
	rows, err := q.db.Query(ctx, getAllUsersAfter, arg.Limit, arg.AfterId)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []User
	for rows.Next() {
		var i User
		if err := rows.Scan(
			&i.Pk,
			&i.Id,
			&i.Username,
			&i.Email,
			&i.Password,
			&i.Claims,
			&i.CreatedDate,
			&i.LastSeen,
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

const getUser = `-- name: GetUser :many
select
	u.pk, u.id, u.username, u.email, u.password, u.claims, u.created_date, u.last_seen,
	h.provider,
	h.id,
	h.username,
	h.profile_url
from
	users as u
	left join oidc_handle as h on u.pk = h.user_pk
where
	u.id = $1
`

type GetUserRow struct {
	User       User    `json:"user"`
	Provider   *string `json:"provider"`
	Id         *string `json:"id"`
	Username   *string `json:"username"`
	ProfileUrl *string `json:"profileUrl"`
}

func (q *Queries) GetUser(ctx context.Context, id uuid.UUID) ([]GetUserRow, error) {
	rows, err := q.db.Query(ctx, getUser, id)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []GetUserRow
	for rows.Next() {
		var i GetUserRow
		if err := rows.Scan(
			&i.User.Pk,
			&i.User.Id,
			&i.User.Username,
			&i.User.Email,
			&i.User.Password,
			&i.User.Claims,
			&i.User.CreatedDate,
			&i.User.LastSeen,
			&i.Provider,
			&i.Id,
			&i.Username,
			&i.ProfileUrl,
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

const getUserByLogin = `-- name: GetUserByLogin :one
select
	pk, id, username, email, password, claims, created_date, last_seen
from
	users
where
	email = $1
	or username = $1
limit 1
`

func (q *Queries) GetUserByLogin(ctx context.Context, login string) (User, error) {
	row := q.db.QueryRow(ctx, getUserByLogin, login)
	var i User
	err := row.Scan(
		&i.Pk,
		&i.Id,
		&i.Username,
		&i.Email,
		&i.Password,
		&i.Claims,
		&i.CreatedDate,
		&i.LastSeen,
	)
	return i, err
}

const touchUser = `-- name: TouchUser :exec
update
	users
set
	last_used = now()::timestamptz
where
	id = $1
`

func (q *Queries) TouchUser(ctx context.Context, id uuid.UUID) error {
	_, err := q.db.Exec(ctx, touchUser, id)
	return err
}

const updateUser = `-- name: UpdateUser :one
update
	users
set
	username = $2,
	email = $3,
	password = $4,
	claims = $5
where
	id = $1
returning
	pk, id, username, email, password, claims, created_date, last_seen
`

type UpdateUserParams struct {
	Id       uuid.UUID     `json:"id"`
	Username string        `json:"username"`
	Email    string        `json:"email"`
	Password *string       `json:"password"`
	Claims   jwt.MapClaims `json:"claims"`
}

func (q *Queries) UpdateUser(ctx context.Context, arg UpdateUserParams) (User, error) {
	row := q.db.QueryRow(ctx, updateUser,
		arg.Id,
		arg.Username,
		arg.Email,
		arg.Password,
		arg.Claims,
	)
	var i User
	err := row.Scan(
		&i.Pk,
		&i.Id,
		&i.Username,
		&i.Email,
		&i.Password,
		&i.Claims,
		&i.CreatedDate,
		&i.LastSeen,
	)
	return i, err
}
