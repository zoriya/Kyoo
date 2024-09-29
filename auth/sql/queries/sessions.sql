-- name: GetUserFromToken :one
select
	s.id,
	s.last_used,
	sqlc.embed(u)
from
	users as u
	inner join sessions as s on u.id = s.user_id
where
	s.token = $1
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
insert into sessions(token, user_id, device)
	values ($1, $2, $3)
returning
	*;

-- name: DeleteSession :one
delete from sessions
where id = $1
	and user_id = $2
returning
	*;

