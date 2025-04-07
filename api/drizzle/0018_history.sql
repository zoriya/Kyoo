ALTER TABLE "kyoo"."history" ALTER COLUMN "video_pk" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "kyoo"."watchlist" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "kyoo"."watchlist_status";--> statement-breakpoint
CREATE TYPE "kyoo"."watchlist_status" AS ENUM('watching', 'rewatching', 'completed', 'dropped', 'planned');--> statement-breakpoint
ALTER TABLE "kyoo"."watchlist" ALTER COLUMN "status" SET DATA TYPE "kyoo"."watchlist_status" USING "status"::"kyoo"."watchlist_status";