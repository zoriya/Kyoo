-- name: ListApiKeys :many
select
	*
from
	apikeys
order by
	last_used;

-- name: CreateApiKey :one
insert into apikeys(name, token, claims)
	values ($1, $2, $3)
returning
	*;

-- name: DeleteApiKey :one
delete from apikeys
where id = $1
returning
	*;

