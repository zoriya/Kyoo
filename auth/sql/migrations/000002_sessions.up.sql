begin;

create table sessions(
	pk serial primary key,
	id uuid not null default gen_random_uuid(),
	token varchar(128) not null unique,
	user_pk integer not null references users(pk) on delete cascade,
	created_date timestamptz not null default now()::timestamptz,
	last_used timestamptz not null default now()::timestamptz,
	device varchar(1024)
);

commit;
