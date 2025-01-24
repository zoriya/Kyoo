create extension if not exists pg_trgm;

CREATE INDEX "name_trgm" ON "kyoo"."show_translations" USING gin ("name" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "tags" ON "kyoo"."show_translations" USING btree ("tags");--> statement-breakpoint
CREATE INDEX "kind" ON "kyoo"."shows" USING hash ("kind");--> statement-breakpoint
CREATE INDEX "rating" ON "kyoo"."shows" USING btree ("rating");--> statement-breakpoint
CREATE INDEX "startAir" ON "kyoo"."shows" USING btree ("start_air");
