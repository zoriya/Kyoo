begin;

create type scanner.request_kind as enum('episode', 'movie');

create table scanner.requests(
	pk serial primary key,
	id uuid not null default gen_random_uuid() unique,
	kind scanner.request_kind not null,
	title text not null,
	year integer,
	external_id jsonb not null default '{}'::jsonb,

	created_at timestamptz not null default now()::timestamptz,

	constraint unique_kty (kind, title, year)
);

commit;
