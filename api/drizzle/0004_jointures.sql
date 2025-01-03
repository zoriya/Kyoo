CREATE TABLE IF NOT EXISTS "kyoo"."entry_video_jointure" (
	"entry" integer NOT NULL,
	"video" integer NOT NULL,
	"slug" varchar(255) NOT NULL,
	CONSTRAINT "entry_video_jointure_entry_video_pk" PRIMARY KEY("entry","video"),
	CONSTRAINT "entry_video_jointure_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "kyoo"."entries_translation" RENAME TO "entry_translations";--> statement-breakpoint
ALTER TABLE "kyoo"."season_translation" RENAME TO "season_translations";--> statement-breakpoint
ALTER TABLE "kyoo"."videos" DROP CONSTRAINT "videos_slug_unique";--> statement-breakpoint
ALTER TABLE "kyoo"."entries" DROP CONSTRAINT "order_positive";--> statement-breakpoint
ALTER TABLE "kyoo"."shows" DROP CONSTRAINT "rating_valid";--> statement-breakpoint
ALTER TABLE "kyoo"."shows" DROP CONSTRAINT "runtime_valid";--> statement-breakpoint
ALTER TABLE "kyoo"."videos" DROP CONSTRAINT "part_pos";--> statement-breakpoint
ALTER TABLE "kyoo"."videos" DROP CONSTRAINT "version_pos";--> statement-breakpoint
ALTER TABLE "kyoo"."entry_translations" DROP CONSTRAINT "entries_translation_pk_entries_pk_fk";
--> statement-breakpoint
ALTER TABLE "kyoo"."season_translations" DROP CONSTRAINT "season_translation_pk_seasons_pk_fk";
--> statement-breakpoint
ALTER TABLE "kyoo"."entry_translations" DROP CONSTRAINT "entries_translation_pk_language_pk";--> statement-breakpoint
ALTER TABLE "kyoo"."season_translations" DROP CONSTRAINT "season_translation_pk_language_pk";--> statement-breakpoint
ALTER TABLE "kyoo"."entry_translations" ADD CONSTRAINT "entry_translations_pk_language_pk" PRIMARY KEY("pk","language");--> statement-breakpoint
ALTER TABLE "kyoo"."season_translations" ADD CONSTRAINT "season_translations_pk_language_pk" PRIMARY KEY("pk","language");--> statement-breakpoint
ALTER TABLE "kyoo"."entry_translations" ADD COLUMN "poster" jsonb;--> statement-breakpoint
ALTER TABLE "kyoo"."videos" ADD COLUMN "guess" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "kyoo"."entry_video_jointure" ADD CONSTRAINT "entry_video_jointure_entry_entries_pk_fk" FOREIGN KEY ("entry") REFERENCES "kyoo"."entries"("pk") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "kyoo"."entry_video_jointure" ADD CONSTRAINT "entry_video_jointure_video_videos_pk_fk" FOREIGN KEY ("video") REFERENCES "kyoo"."videos"("pk") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "kyoo"."entry_translations" ADD CONSTRAINT "entry_translations_pk_entries_pk_fk" FOREIGN KEY ("pk") REFERENCES "kyoo"."entries"("pk") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "kyoo"."season_translations" ADD CONSTRAINT "season_translations_pk_seasons_pk_fk" FOREIGN KEY ("pk") REFERENCES "kyoo"."seasons"("pk") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "kyoo"."videos" DROP COLUMN IF EXISTS "slug";--> statement-breakpoint
ALTER TABLE "kyoo"."entries" ADD CONSTRAINT "order_positive" CHECK ("kyoo"."entries"."order" >= 0);--> statement-breakpoint
ALTER TABLE "kyoo"."shows" ADD CONSTRAINT "rating_valid" CHECK ("kyoo"."shows"."rating" between 0 and 100);--> statement-breakpoint
ALTER TABLE "kyoo"."shows" ADD CONSTRAINT "runtime_valid" CHECK ("kyoo"."shows"."runtime" >= 0);--> statement-breakpoint
ALTER TABLE "kyoo"."videos" ADD CONSTRAINT "part_pos" CHECK ("kyoo"."videos"."part" >= 0);--> statement-breakpoint
ALTER TABLE "kyoo"."videos" ADD CONSTRAINT "version_pos" CHECK ("kyoo"."videos"."version" >= 0);