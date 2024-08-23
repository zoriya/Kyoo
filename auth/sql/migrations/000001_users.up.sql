begin;

create table users(
	id uuid primary key,
	username varchar(256) not null unique,
	email varchar(320) not null unique,
	password text,
	external_handle jsonb not null,
	claims jsonb not null,

	created_date timestampz not null default now()::timestampz,
	last_seen timestampz not null default now()::timestampz
);

commit;
