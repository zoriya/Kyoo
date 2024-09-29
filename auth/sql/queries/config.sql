-- name: LoadConfig :many
select
	*
from
	config;

-- name: SaveConfig :one
insert into config(key, value)
	values ($1, $2)
on conflict (key)
	do update set
		value = excluded.value
	returning
		*;

-- name: DeleteConfig :one
delete from config
where key = $1
returning
	*;

