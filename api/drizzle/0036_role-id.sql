ALTER TABLE "kyoo"."roles" ADD COLUMN "id" uuid DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "kyoo"."roles" ADD CONSTRAINT "roles_id_unique" UNIQUE("id");