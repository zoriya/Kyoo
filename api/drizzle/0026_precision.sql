ALTER TABLE "kyoo"."entries" ALTER COLUMN "created_at" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "kyoo"."entries" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "kyoo"."entries" ALTER COLUMN "updated_at" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "kyoo"."entries" ALTER COLUMN "available_since" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "kyoo"."entries" ALTER COLUMN "next_refresh" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "kyoo"."history" ALTER COLUMN "played_date" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "kyoo"."history" ALTER COLUMN "played_date" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "kyoo"."images" ALTER COLUMN "created_at" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "kyoo"."images" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "kyoo"."images" ALTER COLUMN "downloaded_at" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "kyoo"."mqueue" ALTER COLUMN "created_at" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "kyoo"."mqueue" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "kyoo"."seasons" ALTER COLUMN "created_at" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "kyoo"."seasons" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "kyoo"."seasons" ALTER COLUMN "updated_at" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "kyoo"."seasons" ALTER COLUMN "next_refresh" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "kyoo"."shows" ALTER COLUMN "created_at" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "kyoo"."shows" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "kyoo"."shows" ALTER COLUMN "updated_at" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "kyoo"."shows" ALTER COLUMN "next_refresh" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "kyoo"."staff" ALTER COLUMN "created_at" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "kyoo"."staff" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "kyoo"."staff" ALTER COLUMN "updated_at" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "kyoo"."studios" ALTER COLUMN "created_at" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "kyoo"."studios" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "kyoo"."studios" ALTER COLUMN "updated_at" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "kyoo"."videos" ALTER COLUMN "created_at" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "kyoo"."videos" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "kyoo"."videos" ALTER COLUMN "updated_at" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "kyoo"."watchlist" ALTER COLUMN "started_at" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "kyoo"."watchlist" ALTER COLUMN "last_played_at" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "kyoo"."watchlist" ALTER COLUMN "completed_at" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "kyoo"."watchlist" ALTER COLUMN "created_at" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "kyoo"."watchlist" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "kyoo"."watchlist" ALTER COLUMN "updated_at" SET DATA TYPE timestamp (3) with time zone;