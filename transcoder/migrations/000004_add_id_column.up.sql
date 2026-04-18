begin;

alter table gocoder.info add column id serial unique not null;

-- videos
alter table gocoder.videos add column id integer;
update gocoder.videos v set id = i.id from gocoder.info i where v.sha = i.sha;
alter table gocoder.videos alter column id set not null;

alter table gocoder.videos drop constraint videos_pk;
alter table gocoder.videos drop constraint videos_sha_fkey;
alter table gocoder.videos drop column sha;
alter table gocoder.videos add constraint videos_info_fk
	foreign key (id) references gocoder.info(id) on delete cascade;
alter table gocoder.videos add constraint videos_pk primary key (id, idx);

-- audios
alter table gocoder.audios add column id integer;
update gocoder.audios a set id = i.id from gocoder.info i where a.sha = i.sha;
alter table gocoder.audios alter column id set not null;

alter table gocoder.audios drop constraint audios_pk;
alter table gocoder.audios drop constraint audios_sha_fkey;
alter table gocoder.audios drop column sha;
alter table gocoder.audios add constraint audios_info_fk
	foreign key (id) references gocoder.info(id) on delete cascade;
alter table gocoder.audios add constraint audios_pk primary key (id, idx);

-- subtitles
alter table gocoder.subtitles add column id integer;
update gocoder.subtitles s set id = i.id from gocoder.info i where s.sha = i.sha;
alter table gocoder.subtitles alter column id set not null;

alter table gocoder.subtitles drop constraint subtitle_pk;
alter table gocoder.subtitles drop constraint subtitles_sha_fkey;
alter table gocoder.subtitles drop column sha;
alter table gocoder.subtitles add constraint subtitles_info_fk
	foreign key (id) references gocoder.info(id) on delete cascade;
alter table gocoder.subtitles add constraint subtitle_pk primary key (id, idx);

-- chapters
alter table gocoder.chapters add column id integer;
update gocoder.chapters c set id = i.id from gocoder.info i where c.sha = i.sha;
alter table gocoder.chapters alter column id set not null;

alter table gocoder.chapters drop constraint chapter_pk;
alter table gocoder.chapters drop constraint chapters_sha_fkey;
alter table gocoder.chapters drop column sha;
alter table gocoder.chapters add constraint chapters_info_fk
	foreign key (id) references gocoder.info(id) on delete cascade;
alter table gocoder.chapters add constraint chapter_pk primary key (id, start_time);

alter table gocoder.info drop constraint info_pkey;
alter table gocoder.info add constraint info_pkey primary key(id);

commit;
