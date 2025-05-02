ALTER TABLE "kyoo"."entries" ALTER COLUMN "kind" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "kyoo"."entry_type";--> statement-breakpoint
CREATE TYPE "kyoo"."entry_type" AS ENUM('episode', 'movie', 'special', 'extra');--> statement-breakpoint
ALTER TABLE "kyoo"."entries" ALTER COLUMN "kind" SET DATA TYPE "kyoo"."entry_type" USING "kind"::"kyoo"."entry_type";--> statement-breakpoint
ALTER TABLE "kyoo"."videos" ADD CONSTRAINT "rendering_unique" UNIQUE NULLS NOT DISTINCT("rendering","part","version");