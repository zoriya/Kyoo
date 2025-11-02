-- name: GetApiKey :one
select
	*
from
	keibi.apikeys
where
	name = $1
	and token = $2;

-- name: TouchApiKey :exec
update
	keibi.apikeys
set
	last_used = now()::timestamptz
where
	pk = $1;

-- name: ListApiKeys :many
select
	*
from
	keibi.apikeys
order by
	last_used;

-- name: CreateApiKey :one
insert into keibi.apikeys(name, token, claims, created_by)
	values ($1, $2, $3, $4)
returning
	*;

-- name: DeleteApiKey :one
delete from keibi.apikeys
where id = $1
returning
	*;

