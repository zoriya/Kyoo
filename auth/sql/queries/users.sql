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

-- name: GetUser :one
select
	sqlc.embed(u),
	sqlc.embed(h)
from
	users as u
	left join oidc_handle as h on u.id = h.user_id
where
	u.id = $1
limit 1;

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

