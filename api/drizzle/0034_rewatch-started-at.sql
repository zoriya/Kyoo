ALTER TABLE "kyoo"."watchlist" ADD COLUMN "rewatch_started_at" timestamp (3) with time zone;--> statement-breakpoint
UPDATE "kyoo"."watchlist" SET "rewatch_started_at" = coalesce("completed_at", now()) WHERE "status" = 'rewatching';
