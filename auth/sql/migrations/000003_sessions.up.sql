begin;

create table sessions(
	id uuid not null primary key,
	token varchar(128) not null unique,
	user_id uuid not null references users(id) on delete cascade,
	created_date timestamptz not null default now()::timestamptz,
	last_used timestamptz not null default now()::timestamptz,
	device varchar(1024)
);

commit;
