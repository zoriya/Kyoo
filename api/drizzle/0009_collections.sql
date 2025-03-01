ALTER TYPE "kyoo"."show_kind" ADD VALUE 'collection';--> statement-breakpoint
ALTER TABLE "kyoo"."shows" ADD COLUMN "collection_pk" integer;--> statement-breakpoint
ALTER TABLE "kyoo"."shows" ADD CONSTRAINT "shows_collection_pk_shows_pk_fk" FOREIGN KEY ("collection_pk") REFERENCES "kyoo"."shows"("pk") ON DELETE set null ON UPDATE no action;