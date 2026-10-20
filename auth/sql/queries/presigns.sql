-- name: CreatePresign :execrows
insert into keibi.presigns(token_hash, session_pk, apikey_pk, claims, rules, expires_at)
select
	@token_hash,
	(select s.pk from keibi.sessions as s where s.id = @sid),
	(select k.pk from keibi.apikeys as k where k.id = @sid),
	@claims,
	@rules,
	@expires_at
where
	exists (select from keibi.sessions as s where s.id = @sid)
	or exists (select from keibi.apikeys as k where k.id = @sid);

-- name: CreateEnvPresign :exec
insert into keibi.presigns(token_hash, claims, rules, expires_at)
	values ($1, $2, $3, $4);

-- name: DeleteExpiredPresigns :exec
delete from keibi.presigns
where expires_at < now()::timestamptz;

-- name: GetPresign :one
select
	p.session_pk,
	p.apikey_pk,
	p.claims,
	p.rules,
	p.expires_at,
	s.id as session_id,
	s.last_used as session_last_used,
	u.pk as user_pk,
	u.id as user_id,
	u.username as user_username,
	u.claims as user_claims,
	k.id as apikey_id,
	k.name as apikey_name,
	k.claims as apikey_claims
from
	keibi.presigns as p
	left join keibi.sessions as s on s.pk = p.session_pk
	left join keibi.users as u on u.pk = s.user_pk
	left join keibi.apikeys as k on k.pk = p.apikey_pk
where
	p.token_hash = $1
	and p.expires_at > now()::timestamptz
limit 1;
