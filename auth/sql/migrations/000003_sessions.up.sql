begin;

create table sessions(
	id varchar(128) not null primary key,
	user_id uuid not null references users(id) on delete cascade,
	created_date timestampz not null default now()::timestampz,
	last_used timestampz not null default now()::timestampz,
	device varchar(1024)
);

commit;
