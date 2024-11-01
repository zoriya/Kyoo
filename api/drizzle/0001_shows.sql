--> statement-breakpoint
CREATE TYPE "kyoo"."genres" AS ENUM('action', 'adventure', 'animation', 'comedy', 'crime', 'documentary', 'drama', 'family', 'fantasy', 'history', 'horror', 'music', 'mystery', 'romance', 'science-fiction', 'thriller', 'war', 'western', 'kids', 'reality', 'politics', 'soap', 'talk');--> statement-breakpoint
CREATE TYPE "kyoo"."show_kind" AS ENUM('serie', 'movie');--> statement-breakpoint
CREATE TYPE "kyoo"."show_status" AS ENUM('unknown', 'finished', 'airing', 'planned');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "kyoo"."show_translations" (
	"pk" integer NOT NULL,
	"language" varchar(255) NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"tagline" text,
	"aliases" text[] NOT NULL,
	"tags" text[] NOT NULL,
	"trailerUrl" text,
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
	"genres" genres[] NOT NULL,
	"rating" smallint,
	"status" "kyoo"."show_status" NOT NULL,
	"startAir" date,
	"endAir" date,
	"originalLanguage" varchar(255),
	"externalId" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now(),
	"nextRefresh" timestamp with time zone,
	CONSTRAINT "shows_id_unique" UNIQUE("id"),
	CONSTRAINT "shows_slug_unique" UNIQUE("slug"),
	CONSTRAINT "ratingValid" CHECK (0 <= "shows"."rating" && "shows"."rating" <= 100)
);
--> statement-breakpoint
ALTER TABLE "kyoo"."entries" ADD COLUMN "createdAt" timestamp with time zone DEFAULT now();--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "kyoo"."show_translations" ADD CONSTRAINT "show_translations_pk_shows_pk_fk" FOREIGN KEY ("pk") REFERENCES "kyoo"."shows"("pk") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
