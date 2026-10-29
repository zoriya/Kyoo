begin;

alter table gocoder.videos drop column profile;
alter table gocoder.videos drop column pix_fmt;

commit;
