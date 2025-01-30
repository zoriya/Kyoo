ALTER TABLE "kyoo"."entries" RENAME COLUMN "type" TO "kind";--> statement-breakpoint
ALTER TABLE "kyoo"."entries" ALTER COLUMN "show_pk" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "kyoo"."entries" ADD COLUMN "extra_kind" text;