ALTER TABLE "kyoo"."entry_video_jointure" RENAME TO "entry_video_join";--> statement-breakpoint
ALTER TABLE "kyoo"."entries" RENAME COLUMN "thumbnails" TO "thumbnail";--> statement-breakpoint
ALTER TABLE "kyoo"."entry_video_join" DROP CONSTRAINT "entry_video_jointure_slug_unique";--> statement-breakpoint
ALTER TABLE "kyoo"."entry_video_join" DROP CONSTRAINT "entry_video_jointure_entry_entries_pk_fk";
--> statement-breakpoint
ALTER TABLE "kyoo"."entry_video_join" DROP CONSTRAINT "entry_video_jointure_video_videos_pk_fk";
--> statement-breakpoint
ALTER TABLE "kyoo"."entry_video_join" DROP CONSTRAINT "entry_video_jointure_entry_video_pk";--> statement-breakpoint
ALTER TABLE "kyoo"."entry_video_join" ADD CONSTRAINT "entry_video_join_entry_video_pk" PRIMARY KEY("entry","video");--> statement-breakpoint
ALTER TABLE "kyoo"."entry_video_join" ADD CONSTRAINT "entry_video_join_entry_entries_pk_fk" FOREIGN KEY ("entry") REFERENCES "kyoo"."entries"("pk") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kyoo"."entry_video_join" ADD CONSTRAINT "entry_video_join_video_videos_pk_fk" FOREIGN KEY ("video") REFERENCES "kyoo"."videos"("pk") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kyoo"."entry_video_join" ADD CONSTRAINT "entry_video_join_slug_unique" UNIQUE("slug");