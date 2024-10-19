-- name: GetAllUsers :many
select
	*
from
	users
order by
	id
limit $1;

-- name: GetAllUsersAfter :many
select
	*
from
	users
where
	id >= sqlc.arg(after_id)
order by
	id
limit $1;

-- name: GetUser :many
select
	sqlc.embed(u),
	h.provider,
	h.id,
	h.username,
	h.profile_url
from
	users as u
	left join oidc_handle as h on u.pk = h.user_pk
where
	u.id = $1;

-- name: GetUserByLogin :one
select
	*
from
	users
where
	email = sqlc.arg(login)
	or username = sqlc.arg(login)
limit 1;

-- name: TouchUser :exec
update
	users
set
	last_used = now()::timestamptz
where
	id = $1;

-- name: CreateUser :one
insert into users(username, email, password, claims)
	values ($1, $2, $3, $4)
returning
	*;

-- name: UpdateUser :one
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
	*;

-- name: DeleteUser :one
delete from users
where id = $1
returning
	*;

