begin;

create table keibi.device_login(
	pk serial primary key,
	device_code varchar(128) not null unique,
	user_code varchar(8) not null unique,
	device varchar(1024),
	user_pk integer references keibi.users(pk) on delete cascade,
	created_at timestamptz not null default now()::timestamptz
);

commit;
