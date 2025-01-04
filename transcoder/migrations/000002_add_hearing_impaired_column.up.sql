begin;

alter table subtitles add column is_hearing_impaired boolean not null default false;

commit;
