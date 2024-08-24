-- name: GetAllUsers :many
select
	u.*,
from
	users as u
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
	sqlc.embed(users),
	sql.embed(oidc_handle)
from
	users as u
	left join oidc_handle as h on u.id = h.user_id
where
	id = $1
limit 1;

-- name: CreateUser :one
insert into users(username, email, password, claims)
	values (?, ?, ?, ?)
returning
	*;

-- name: UpdateUser :one
update
	users
set
	username = ?,
	email = ?,
	password = ?,
	claims = ?
where
	id = ?
returning
	*;

-- name: DeleteUser :one
delete from users
where id = ?
returning
	*;

