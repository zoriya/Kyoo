ALTER TABLE "kyoo"."entries" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "kyoo"."entries" ALTER COLUMN "next_refresh" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "kyoo"."seasons" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "kyoo"."seasons" ALTER COLUMN "next_refresh" SET NOT NULL;--> statement-breakpoint
CREATE INDEX "show_fk" ON "kyoo"."seasons" USING hash ("show_pk");