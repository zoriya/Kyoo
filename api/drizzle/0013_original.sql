ALTER TABLE "kyoo"."videos" ALTER COLUMN "guess" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "kyoo"."shows" ADD COLUMN "original" jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "kyoo"."shows" DROP COLUMN "original_language";