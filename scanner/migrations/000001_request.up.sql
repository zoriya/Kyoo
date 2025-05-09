begin;

create type scanner.request_kind as enum(
	'episode',
	'movie'
);

create type scanner.request_status as enum(
	'pending',
	'running',
	'failed'
);

create table scanner.requests(
	pk serial primary key,
	id uuid not null default gen_random_uuid() unique,
	kind scanner.request_kind not null,
	title text not null,
	year integer,
	external_id jsonb not null default '{}' ::jsonb,
	status scanner.request_status not null,
	started_at created_at timestamptz,
	created_at created_at timestamptz not null default now() ::timestamptz,
	constraint unique_kty(kind, title, year),
	constraint unique_eid(external_id)
);

commit;

