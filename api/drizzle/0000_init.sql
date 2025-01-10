CREATE TYPE "kyoo"."entry_type" AS ENUM('unknown', 'episode', 'movie', 'special', 'extra');--> statement-breakpoint
CREATE TYPE "kyoo"."genres" AS ENUM('action', 'adventure', 'animation', 'comedy', 'crime', 'documentary', 'drama', 'family', 'fantasy', 'history', 'horror', 'music', 'mystery', 'romance', 'science-fiction', 'thriller', 'war', 'western', 'kids', 'reality', 'politics', 'soap', 'talk');--> statement-breakpoint
CREATE TYPE "kyoo"."show_kind" AS ENUM('serie', 'movie');--> statement-breakpoint
CREATE TYPE "kyoo"."show_status" AS ENUM('unknown', 'finished', 'airing', 'planned');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "kyoo"."entries" (
	"pk" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "kyoo"."entries_pk_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(255) NOT NULL,
	"show_pk" integer,
	"order" integer NOT NULL,
	"season_number" integer,
	"episode_number" integer,
	"type" "kyoo"."entry_type" NOT NULL,
	"air_date" date,
	"runtime" integer,
	"thumbnails" jsonb,
	"external_id" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"next_refresh" timestamp with time zone,
	CONSTRAINT "entries_id_unique" UNIQUE("id"),
	CONSTRAINT "entries_slug_unique" UNIQUE("slug"),
	CONSTRAINT "entries_showPk_seasonNumber_episodeNumber_unique" UNIQUE("show_pk","season_number","episode_number"),
	CONSTRAINT "order_positive" CHECK ("entries"."order" >= 0)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "kyoo"."entries_translation" (
	"pk" integer NOT NULL,
	"language" varchar(255) NOT NULL,
	"name" text,
	"description" text,
	CONSTRAINT "entries_translation_pk_language_pk" PRIMARY KEY("pk","language")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "kyoo"."show_translations" (
	"pk" integer NOT NULL,
	"language" varchar(255) NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"tagline" text,
	"aliases" text[] NOT NULL,
	"tags" text[] NOT NULL,
	"trailer_url" text,
	"poster" jsonb,
	"thumbnail" jsonb,
	"banner" jsonb,
	"logo" jsonb,
	CONSTRAINT "show_translations_pk_language_pk" PRIMARY KEY("pk","language")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "kyoo"."shows" (
	"pk" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "kyoo"."shows_pk_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(255) NOT NULL,
	"kind" "kyoo"."show_kind" NOT NULL,
	"genres" "kyoo"."genres"[] NOT NULL,
	"rating" smallint,
	"runtime" integer,
	"status" "kyoo"."show_status" NOT NULL,
	"start_air" date,
	"end_air" date,
	"original_language" varchar(255),
	"external_id" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"next_refresh" timestamp with time zone NOT NULL,
	CONSTRAINT "shows_id_unique" UNIQUE("id"),
	CONSTRAINT "shows_slug_unique" UNIQUE("slug"),
	CONSTRAINT "rating_valid" CHECK ("shows"."rating" between 0 and 100),
	CONSTRAINT "runtime_valid" CHECK ("shows"."runtime" >= 0)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "kyoo"."videos" (
	"pk" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "kyoo"."videos_pk_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"path" text NOT NULL,
	"rendering" integer,
	"part" integer,
	"version" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "videos_id_unique" UNIQUE("id"),
	CONSTRAINT "videos_path_unique" UNIQUE("path"),
	CONSTRAINT "rendering_pos" CHECK ("videos"."rendering" >= 0),
	CONSTRAINT "part_pos" CHECK ("videos"."part" >= 0),
	CONSTRAINT "version_pos" CHECK ("videos"."version" >= 0)
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "kyoo"."entries" ADD CONSTRAINT "entries_show_pk_shows_pk_fk" FOREIGN KEY ("show_pk") REFERENCES "kyoo"."shows"("pk") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "kyoo"."entries_translation" ADD CONSTRAINT "entries_translation_pk_entries_pk_fk" FOREIGN KEY ("pk") REFERENCES "kyoo"."entries"("pk") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "kyoo"."show_translations" ADD CONSTRAINT "show_translations_pk_shows_pk_fk" FOREIGN KEY ("pk") REFERENCES "kyoo"."shows"("pk") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
