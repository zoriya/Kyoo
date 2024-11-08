CREATE TABLE IF NOT EXISTS "kyoo"."videos" (
	"pk" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "kyoo"."videos_pk_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"path" text NOT NULL,
	"rendering" integer,
	"part" integer,
	"version" integer,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "videos_id_unique" UNIQUE("id"),
	CONSTRAINT "videos_path_unique" UNIQUE("path"),
	CONSTRAINT "renderingPos" CHECK (0 <= "videos"."rendering"),
	CONSTRAINT "partPos" CHECK (0 <= "videos"."part"),
	CONSTRAINT "versionPos" CHECK (0 <= "videos"."version")
);
--> statement-breakpoint
ALTER TABLE "kyoo"."shows" ADD COLUMN "runtime" integer;--> statement-breakpoint
ALTER TABLE "kyoo"."shows" ADD CONSTRAINT "runtimeValid" CHECK (0 <= "shows"."runtime");
