-- name: GetUserFromToken :one
select
	s.id,
	s.last_used,
	sqlc.embed(u)
from
	users as u
	inner join sessions as s on u.pk = s.user_pk
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
	s.*
from
	sessions as s
	inner join users as u on u.pk = s.user_pk
where
	u.pk = $1
order by
	last_used;

-- name: CreateSession :one
insert into sessions(token, user_pk, device)
	values ($1, $2, $3)
returning
	*;

-- name: DeleteSession :one
delete from sessions as s using users as u
where s.user_pk = u.pk
	and s.id = $1
	and u.id = sqlc.arg(user_id)
returning
	s.*;

