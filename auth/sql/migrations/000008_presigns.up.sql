begin;

create table keibi.presigns(
	pk serial primary key,
	token_hash varchar(256) not null unique,
	session_pk integer references keibi.sessions(pk) on delete cascade,
	apikey_pk integer references keibi.apikeys(pk) on delete cascade,
	claims jsonb not null,
	rules jsonb not null,
	created_at timestamptz not null default now()::timestamptz,
	expires_at timestamptz not null
);

create index presigns_session_pk on keibi.presigns(session_pk);
create index presigns_apikey_pk on keibi.presigns(apikey_pk);
create index presigns_expires_at on keibi.presigns(expires_at);

commit;
