-- name: GetUserFromToken :one
select
	s.pk,
	s.id,
	s.last_used,
	sqlc.embed(u)
from
	keibi.users as u
	inner join keibi.sessions as s on u.pk = s.user_pk
where
	s.token = $1
limit 1;

-- name: TouchSession :exec
update
	keibi.sessions
set
	last_used = now()::timestamptz
where
	pk = $1;

-- name: GetUserSessions :many
select
	s.*
from
	keibi.sessions as s
	inner join keibi.users as u on u.pk = s.user_pk
where
	u.pk = $1
order by
	last_used;

-- name: CreateSession :one
insert into keibi.sessions(token, user_pk, device)
	values ($1, $2, $3)
returning
	*;

-- name: DeleteSession :one
delete from keibi.sessions as s using keibi.users as u
where s.user_pk = u.pk
	and s.id = $1
	and u.id = sqlc.arg(user_id)
returning
	s.*;

-- name: ClearOtherSessions :exec
delete from keibi.sessions as s using keibi.users as u
where s.user_pk = u.pk
	and s.id != @session_id
	and u.id = @user_id;
