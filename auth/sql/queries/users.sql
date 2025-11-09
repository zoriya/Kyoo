-- name: GetAllUsers :many
select
	*
from
	keibi.users
order by
	id
limit $1;

-- name: GetAllUsersAfter :many
select
	*
from
	keibi.users
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
	keibi.users as u
	left join keibi.oidc_handle as h on u.pk = h.user_pk
where (@use_id::boolean
	and u.id = @id)
	or (not @use_id
		and u.username = @username);

-- name: GetUserByLogin :one
select
	*
from
	keibi.users
where
	email = sqlc.arg(login)
	or username = sqlc.arg(login)
limit 1;

-- name: TouchUser :exec
update
	keibi.users
set
	last_seen = now()::timestamptz
where
	pk = $1;

-- name: CreateUser :one
insert into keibi.users(username, email, password, claims)
	values ($1, $2, $3, case when not exists (
			select
				*
			from
				keibi.users) then
			sqlc.arg(first_claims)::jsonb
		else
			sqlc.arg(claims)::jsonb
		end)
returning
	*;

-- name: UpdateUser :one
update
	keibi.users
set
	username = coalesce(sqlc.narg(username), username),
	email = coalesce(sqlc.narg(email), email),
	password = coalesce(sqlc.narg(password), password),
	claims = claims || coalesce(sqlc.narg(claims), '{}'::jsonb)
where
	id = $1
returning
	*;

-- name: DeleteUser :one
delete from keibi.users
where id = $1
returning
	*;

