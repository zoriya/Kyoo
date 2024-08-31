begin;

create table users(
	id uuid not null primary key,
	username varchar(256) not null unique,
	email varchar(320) not null unique,
	password text,
	claims jsonb not null,

	created_date timestamptz not null default now()::timestamptz,
	last_seen timestamptz not null default now()::timestamptz
);

create table oidc_handle(
	user_id uuid not null references users(id) on delete cascade,
	provider varchar(256) not null,

	id text not null,
	username varchar(256) not null,
	profile_url text,

	access_token text,
	refresh_token text,
	expire_at timestamptz,

	constraint oidc_handle_pk primary key (user_id, provider)
);

commit;
