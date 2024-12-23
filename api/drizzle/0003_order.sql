ALTER TABLE "kyoo"."entries" ALTER COLUMN "order" SET DATA TYPE real;--> statement-breakpoint
ALTER TABLE "kyoo"."entries_translation" ADD COLUMN "tagline" text;--> statement-breakpoint
ALTER TABLE "kyoo"."season_translation" DROP COLUMN IF EXISTS "logo";
