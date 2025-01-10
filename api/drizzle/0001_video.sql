ALTER TABLE "kyoo"."videos" DROP CONSTRAINT "rendering_pos";--> statement-breakpoint
ALTER TABLE "kyoo"."videos" ALTER COLUMN "rendering" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "kyoo"."videos" ALTER COLUMN "rendering" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "kyoo"."videos" ALTER COLUMN "version" SET DEFAULT 1;--> statement-breakpoint
ALTER TABLE "kyoo"."videos" ALTER COLUMN "version" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "kyoo"."videos" ADD COLUMN "slug" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "kyoo"."videos" ADD CONSTRAINT "videos_slug_unique" UNIQUE("slug");