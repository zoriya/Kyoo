begin;

alter table gocoder.videos add column profile varchar(256);
alter table gocoder.videos add column pix_fmt varchar(256);

commit;
