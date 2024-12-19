CREATE TABLE IF NOT EXISTS "kyoo"."season_translation" (
	"pk" integer NOT NULL,
	"language" varchar(255) NOT NULL,
	"name" text,
	"description" text,
	"poster" jsonb,
	"thumbnail" jsonb,
	"logo" jsonb,
	"banner" jsonb,
	CONSTRAINT "season_translation_pk_language_pk" PRIMARY KEY("pk","language")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "kyoo"."seasons" (
	"pk" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "kyoo"."seasons_pk_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(255) NOT NULL,
	"show_pk" integer,
	"season_number" integer NOT NULL,
	"start_air" date,
	"end_air" date,
	"external_id" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"next_refresh" timestamp with time zone,
	CONSTRAINT "seasons_id_unique" UNIQUE("id"),
	CONSTRAINT "seasons_slug_unique" UNIQUE("slug"),
	CONSTRAINT "seasons_showPk_seasonNumber_unique" UNIQUE("show_pk","season_number")
);
--> statement-breakpoint
ALTER TABLE "kyoo"."entries" ALTER COLUMN "order" DROP NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "kyoo"."season_translation" ADD CONSTRAINT "season_translation_pk_seasons_pk_fk" FOREIGN KEY ("pk") REFERENCES "kyoo"."seasons"("pk") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "kyoo"."seasons" ADD CONSTRAINT "seasons_show_pk_shows_pk_fk" FOREIGN KEY ("show_pk") REFERENCES "kyoo"."shows"("pk") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
