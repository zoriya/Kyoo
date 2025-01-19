CREATE OR REPLACE FUNCTION array_to_string_im(text[], text)
  RETURNS text LANGUAGE sql IMMUTABLE AS $$SELECT array_to_string($1, $2)$$;

ALTER TABLE "kyoo"."show_translations" ADD COLUMN "search" "tsvector" GENERATED ALWAYS AS (
			setweight(to_tsvector('simple', "kyoo"."show_translations"."name"), 'A') ||
			setweight(to_tsvector('simple', array_to_string_im("kyoo"."show_translations"."aliases", ' ')), 'B') ||
			setweight(to_tsvector('simple', array_to_string_im("kyoo"."show_translations"."tags", ' ')), 'C') ||
			setweight(to_tsvector('simple', coalesce("kyoo"."show_translations"."tagline", '')), 'D') ||
			setweight(to_tsvector('simple', coalesce("kyoo"."show_translations"."description", '')), 'D')
		) STORED;--> statement-breakpoint
CREATE INDEX "search" ON "kyoo"."show_translations" USING gin ("search");--> statement-breakpoint
CREATE INDEX "kind" ON "kyoo"."shows" USING hash ("kind");--> statement-breakpoint
CREATE INDEX "rating" ON "kyoo"."shows" USING btree ("rating");--> statement-breakpoint
CREATE INDEX "startAir" ON "kyoo"."shows" USING btree ("start_air");
