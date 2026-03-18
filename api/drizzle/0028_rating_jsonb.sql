DROP INDEX "kyoo"."rating";--> statement-breakpoint
ALTER TABLE "kyoo"."shows" DROP CONSTRAINT "rating_valid";--> statement-breakpoint
ALTER TABLE "kyoo"."shows" ALTER COLUMN "rating" SET DATA TYPE jsonb USING COALESCE(jsonb_build_object('legacy', "rating"), '{}');--> statement-breakpoint
ALTER TABLE "kyoo"."shows" ALTER COLUMN "rating" SET DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "kyoo"."shows" ALTER COLUMN "rating" SET NOT NULL;
