begin;

alter table subtitles add column mime_codec varchar(256) default null;

commit;
