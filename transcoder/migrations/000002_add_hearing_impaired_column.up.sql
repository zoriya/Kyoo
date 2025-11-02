begin;

alter table gocoder.subtitles add column is_hearing_impaired boolean not null default false;

commit;
