ALTER TABLE "kyoo"."shows" ADD COLUMN "entries_count" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "kyoo"."shows" ADD COLUMN "available_count" integer DEFAULT 0 NOT NULL;