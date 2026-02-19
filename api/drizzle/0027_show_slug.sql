ALTER TABLE "kyoo"."shows" DROP CONSTRAINT "shows_slug_unique";--> statement-breakpoint
CREATE INDEX "slug" ON "kyoo"."shows" USING btree ("slug");--> statement-breakpoint
ALTER TABLE "kyoo"."shows" ADD CONSTRAINT "kind_slug" UNIQUE("kind","slug");