-- name: GetAllUsers :many
select
	*
from
	users
order by
	created_date
limit $1;

-- name: GetUser :one
select
	*
from
	users
where
	id = $1
limit 1;

-- name: CreateUser :one
insert into users(username, email, password, external_handle, claims)
	values ($1, $2, $3, $4, $5)
returning
	*;

-- name: UpdateUser :one
update
	users
set
	username = $2,
	email = $3,
	password = $4,
	external_handle = $5,
	claims = $6
where
	id = $1
returning
	*;

-- name: DeleteUser :one
delete from users
where id = $1
returning
	*;

