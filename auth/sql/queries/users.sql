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
where (@use_id::boolean
	and u.id = @id)
	or (not @use_id
		and u.username = @username);

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
	pk = $1;

-- name: CreateUser :one
insert into users(username, email, password, claims)
	values ($1, $2, $3, case when not exists (
			select
				*
			from
				users) then
			sqlc.arg(first_claims)::jsonb
		else
			sqlc.arg(claims)::jsonb
		end)
returning
	*;

-- name: UpdateUser :one
update
	users
set
	username = coalesce(sqlc.narg(username), username),
	email = coalesce(sqlc.narg(email), email),
	password = coalesce(sqlc.narg(password), password),
	claims = coalesce(sqlc.narg(claims), claims)
where
	id = $1
returning
	*;

-- name: DeleteUser :one
delete from users
where id = $1
returning
	*;

