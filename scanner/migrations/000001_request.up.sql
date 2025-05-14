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
	external_id jsonb not null default '{}'::jsonb,
	videos jsonb not null default '[]'::jsonb,
	status scanner.request_status not null default 'pending',
	started_at timestamptz,
	created_at timestamptz not null default now()::timestamptz,
	constraint unique_kty unique(kind, title, year)
);
