ALTER TABLE "kyoo"."seasons" ADD COLUMN "entries_count" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "kyoo"."seasons" ADD COLUMN "available_count" integer DEFAULT 0 NOT NULL;