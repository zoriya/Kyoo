begin;

create table info(
	sha varchar(40) not null primary key,
	path varchar(4096) not null unique,
	extension varchar(16),
	mime_codec varchar(1024),
	size bigint not null,
	duration real not null,
	container varchar(256),
	fonts text[] not null,
	ver_info integer not null,
	ver_extract integer not null,
	ver_thumbs integer not null,
	ver_keyframes integer not null
);

create table videos(
	sha varchar(40) not null references info(sha) on delete cascade,
	idx integer not null,
	title varchar(1024),
	language varchar(256),
	codec varchar(256) not null,
	mime_codec varchar(256),
	width integer not null,
	height integer not null,
	bitrate integer not null,
	is_default boolean not null,

	keyframes double precision[],

	constraint videos_pk primary key (sha, idx)
);

create table audios(
	sha varchar(40) not null references info(sha) on delete cascade,
	idx integer not null,
	title varchar(1024),
	language varchar(256),
	codec varchar(256) not null,
	mime_codec varchar(256),
	bitrate integer not null,
	is_default boolean not null,

	keyframes double precision[],

	constraint audios_pk primary key (sha, idx)
);

create table subtitles(
	sha varchar(40) not null references info(sha) on delete cascade,
	idx integer not null,
	title varchar(1024),
	language varchar(256),
	codec varchar(256) not null,
	extension varchar(16),
	is_default boolean not null,
	is_forced boolean not null,

	constraint subtitle_pk primary key (sha, idx)
);

create type chapter_type as enum('content', 'recap', 'intro', 'credits', 'preview');

create table chapters(
	sha varchar(40) not null references info(sha) on delete cascade,
	start_time real not null,
	end_time real not null,
	name varchar(1024),
	type chapter_type,

	constraint chapter_pk primary key (sha, start_time)
);

commit;
