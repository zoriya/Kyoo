begin;

create table sessions(
	id varchar(128) not null primary key,
	user_id uuid not null references users(id) on delete cascade,
	created_date timestamptz not null default now()::timestamptz,
	last_used timestamptz not null default now()::timestamptz,
	device varchar(1024)
);

commit;
