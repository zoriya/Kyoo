begin;

create table config(
	key varchar(256) not null primary key,
	value text not null
);

commit;
