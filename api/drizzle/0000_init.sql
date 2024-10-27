CREATE TYPE "kyoo"."entry_type" AS ENUM('unknown', 'episode', 'movie', 'special', 'extra');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "kyoo"."entries" (
	"pk" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "kyoo"."entries_pk_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(255) NOT NULL,
	"order" integer NOT NULL,
	"seasonNumber" integer,
	"episodeNumber" integer,
	"type" "kyoo"."entry_type" NOT NULL,
	"airDate" date,
	"runtime" integer,
	"thumbnails" jsonb,
	"nextRefresh" timestamp with time zone,
	"externalId" jsonb DEFAULT '{}'::jsonb NOT NULL,
	CONSTRAINT "entries_id_unique" UNIQUE("id"),
	CONSTRAINT "entries_slug_unique" UNIQUE("slug"),
	CONSTRAINT "orderPositive" CHECK ("entries"."order" >= 0)
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
DO $$ BEGIN
 ALTER TABLE "kyoo"."entries_translation" ADD CONSTRAINT "entries_translation_pk_entries_pk_fk" FOREIGN KEY ("pk") REFERENCES "kyoo"."entries"("pk") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
