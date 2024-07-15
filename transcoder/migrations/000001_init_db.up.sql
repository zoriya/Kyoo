begin;

create table if not exists info(
	sha varchar(20) not null primary key,
	path varchar(4096) not null unique,
	extension varchar(256),
	mime_codec varchar(1024),
	size bigint not null,
	duration real not null,
	container varchar(256)
);

create table if not exists videos(
	sha varchar(20) not null primary key,

)

commit;
