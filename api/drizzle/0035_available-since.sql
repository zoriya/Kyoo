update
	kyoo.entries e
set
	available_since = greatest(e.created_at, v.created_at)
from (
	select
		j.entry_pk,
		min(vid.created_at) as created_at
	from
		kyoo.entry_video_join as j
		inner join kyoo.videos as vid on vid.pk = j.video_pk
	group by
		j.entry_pk) as v
where
	v.entry_pk = e.pk
	and e.available_since is null; --> statement-breakpoint

update
	kyoo.entries e
set
	available_since = null
where
	e.available_since is not null
	and not exists (
		select
			1
		from
			kyoo.entry_video_join as j
		where
			j.entry_pk = e.pk);

