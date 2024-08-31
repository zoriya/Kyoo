-- name: GetUserFromSession :one
select
	u.*
from
	users as u
	left join sessions as s on u.id = s.user_id
where
	s.id = $1
limit 1;

-- name: TouchSession :exec
update
	sessions
set
	last_used = now()::timestamptz
where
	id = $1;

-- name: GetUserSessions :many
select
	*
from
	sessions
where
	user_id = $1
order by
	last_used;

-- name: CreateSession :one
insert into sessions(id, user_id, device)
	values ($1, $2, $3)
returning
	*;

-- name: DeleteSession :one
delete from sessions
where id = $1
returning
	*;

