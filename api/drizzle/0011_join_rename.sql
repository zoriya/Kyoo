ALTER TABLE "kyoo"."show_studio_join" RENAME COLUMN "show" TO "show_pk";--> statement-breakpoint
ALTER TABLE "kyoo"."show_studio_join" RENAME COLUMN "studio" TO "studio_pk";--> statement-breakpoint
ALTER TABLE "kyoo"."entry_video_join" RENAME COLUMN "entry" TO "entry_pk";--> statement-breakpoint
ALTER TABLE "kyoo"."entry_video_join" RENAME COLUMN "video" TO "video_pk";--> statement-breakpoint
ALTER TABLE "kyoo"."show_studio_join" DROP CONSTRAINT "show_studio_join_show_shows_pk_fk";
--> statement-breakpoint
ALTER TABLE "kyoo"."show_studio_join" DROP CONSTRAINT "show_studio_join_studio_studios_pk_fk";
--> statement-breakpoint
ALTER TABLE "kyoo"."entry_video_join" DROP CONSTRAINT "entry_video_join_entry_entries_pk_fk";
--> statement-breakpoint
ALTER TABLE "kyoo"."entry_video_join" DROP CONSTRAINT "entry_video_join_video_videos_pk_fk";
--> statement-breakpoint
ALTER TABLE "kyoo"."show_studio_join" DROP CONSTRAINT "show_studio_join_show_studio_pk";--> statement-breakpoint
ALTER TABLE "kyoo"."entry_video_join" DROP CONSTRAINT "entry_video_join_entry_video_pk";--> statement-breakpoint
ALTER TABLE "kyoo"."show_studio_join" ADD CONSTRAINT "show_studio_join_show_pk_studio_pk_pk" PRIMARY KEY("show_pk","studio_pk");--> statement-breakpoint
ALTER TABLE "kyoo"."entry_video_join" ADD CONSTRAINT "entry_video_join_entry_pk_video_pk_pk" PRIMARY KEY("entry_pk","video_pk");--> statement-breakpoint
ALTER TABLE "kyoo"."show_studio_join" ADD CONSTRAINT "show_studio_join_show_pk_shows_pk_fk" FOREIGN KEY ("show_pk") REFERENCES "kyoo"."shows"("pk") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kyoo"."show_studio_join" ADD CONSTRAINT "show_studio_join_studio_pk_studios_pk_fk" FOREIGN KEY ("studio_pk") REFERENCES "kyoo"."studios"("pk") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kyoo"."entry_video_join" ADD CONSTRAINT "entry_video_join_entry_pk_entries_pk_fk" FOREIGN KEY ("entry_pk") REFERENCES "kyoo"."entries"("pk") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kyoo"."entry_video_join" ADD CONSTRAINT "entry_video_join_video_pk_videos_pk_fk" FOREIGN KEY ("video_pk") REFERENCES "kyoo"."videos"("pk") ON DELETE cascade ON UPDATE no action;