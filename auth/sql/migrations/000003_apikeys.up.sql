begin;

create table apikeys(
	pk serial primary key,
	id uuid not null default gen_random_uuid(),
	name varchar(256) not null unique,
	token varchar(128) not null unique,
	claims jsonb not null,

	created_by integer references users(pk) on delete cascade,
	created_at timestamptz not null default now()::timestamptz,
	last_used timestamptz not null default now()::timestamptz
);

commit;
