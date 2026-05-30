-- name: GetAllUsers :many
select
	sqlc.embed(u),
	coalesce(
		jsonb_object_agg(
			h.provider,
			jsonb_build_object(
				'id', h.id,
				'username', h.username,
				'profileUrl', h.profile_url
			)
		) filter (
			where
				h.provider is not null
		),
		'{}'::jsonb
	)::keibi.user_oidc as oidc
from
	keibi.users as u
	left join keibi.oidc_handle as h on u.pk = h.user_pk
group by
	u.pk
order by
	u.pk
limit $1;

-- name: GetAllUsersAfter :many
select
	sqlc.embed(u),
	coalesce(
		jsonb_object_agg(
			h.provider,
			jsonb_build_object(
				'id', h.id,
				'username', h.username,
				'profileUrl', h.profile_url
			)
		) filter (
			where
				h.provider is not null
		),
		'{}'::jsonb
	)::keibi.user_oidc as oidc
from
	keibi.users as u
	left join keibi.oidc_handle as h on u.pk = h.user_pk
where
	u.pk >= sqlc.arg(after_pk)
group by
	u.pk
order by
	u.pk
limit $1;

-- name: GetUser :one
select
	sqlc.embed(u),
	coalesce(
		jsonb_object_agg(
			h.provider,
			jsonb_build_object(
				'id', h.id,
				'username', h.username,
				'profileUrl', h.profile_url
			)
		) filter (
			where
				h.provider is not null
		),
		'{}'::jsonb
	)::keibi.user_oidc as oidc
from
	keibi.users as u
	left join keibi.oidc_handle as h on u.pk = h.user_pk
where (@use_id::boolean
	and u.id = @id)
	or (not @use_id
		and u.username = @username)
group by
	u.pk;

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

-- name: GetUserByEmail :one
select
	*
from
	keibi.users
where
	email = $1
limit 1;

-- name: GetUserByOidc :one
select
	u.*
from
	keibi.users as u
	inner join keibi.oidc_handle as h on u.pk = h.user_pk
where
	h.provider = $1
	and h.id = $2
limit 1;

-- name: UpsertOidcHandle :exec
insert into keibi.oidc_handle(user_pk, provider, id, username, profile_url, access_token, refresh_token, expire_at)
	values ($1, $2, $3, $4, $5, $6, $7, $8)
on conflict (user_pk, provider)
	do update set
		id = excluded.id,
		username = excluded.username,
		profile_url = excluded.profile_url,
		access_token = excluded.access_token,
		refresh_token = excluded.refresh_token,
		expire_at = excluded.expire_at;

-- name: DeleteOidcHandle :exec
delete from keibi.oidc_handle
where
	user_pk = $1
	and provider = $2;

-- name: GetOidcHandleTokenByUserId :one
select
	h.access_token,
	h.refresh_token,
	h.expire_at
from
	keibi.oidc_handle as h
	inner join keibi.users as u on u.pk = h.user_pk
where
	u.id = $1
	and h.provider = $2
limit 1;
