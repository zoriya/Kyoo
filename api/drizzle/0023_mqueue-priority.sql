ALTER TABLE "kyoo"."history" ALTER COLUMN "time" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "kyoo"."history" ALTER COLUMN "time" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "kyoo"."mqueue" ADD COLUMN "priority" integer DEFAULT 0 NOT NULL;