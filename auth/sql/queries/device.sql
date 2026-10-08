-- name: CreateDeviceLogin :one
insert into keibi.device_login(device_code, user_code, device)
	values ($1, $2, $3)
returning
	*;

-- name: GetDeviceLogin :one
select
	*
from
	keibi.device_login
where
	device_code = $1
	and created_at + interval '10 min' > now()::timestamptz
limit 1;

-- name: ApproveDeviceLogin :one
update
	keibi.device_login
set
	user_pk = $2
where
	user_code = $1
	and user_pk is null
	and created_at + interval '10 min' > now()::timestamptz
returning
	*;

-- name: ConsumeDeviceLogin :one
delete from keibi.device_login
where
	device_code = $1
	and user_pk is not null
	and created_at + interval '10 min' > now()::timestamptz
returning
	*;

-- name: CleanupDeviceLogins :exec
delete from keibi.device_login
where created_at + interval '10 min' < now()::timestamptz;
