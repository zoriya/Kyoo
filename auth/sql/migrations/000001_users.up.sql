begin;

create schema if not exists keibi;

create table keibi.users(
	pk serial primary key,
	id uuid not null default gen_random_uuid(),
	username varchar(256) not null unique,
	email varchar(320) not null unique,
	password text,
	claims jsonb not null,

	created_date timestamptz not null default now()::timestamptz,
	last_seen timestamptz not null default now()::timestamptz
);

create table keibi.oidc_handle(
	user_pk integer not null references keibi.users(pk) on delete cascade,
	provider varchar(256) not null,

	id text not null,
	username varchar(256) not null,
	profile_url text,

	access_token text,
	refresh_token text,
	expire_at timestamptz,

	constraint oidc_handle_pk primary key (user_pk, provider)
);

commit;
