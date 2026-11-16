-- delete duplicated shows (same external ids but different slugs), keep the oldest one
DELETE FROM "kyoo"."shows" AS s USING "kyoo"."shows" AS o
WHERE s."kind" = o."kind" AND s."pk" > o."pk" AND (
	s."external_id" -> 'themoviedatabase' -> 0 ->> 'dataId' = o."external_id" -> 'themoviedatabase' -> 0 ->> 'dataId'
	OR s."external_id" -> 'tvdb' -> 0 ->> 'dataId' = o."external_id" -> 'tvdb' -> 0 ->> 'dataId'
	OR s."external_id" -> 'imdb' -> 0 ->> 'dataId' = o."external_id" -> 'imdb' -> 0 ->> 'dataId'
);--> statement-breakpoint
CREATE UNIQUE INDEX "show_tmdb_id" ON "kyoo"."shows" USING btree ("kind",("external_id" -> 'themoviedatabase' -> 0 ->> 'dataId'));--> statement-breakpoint
CREATE UNIQUE INDEX "show_tvdb_id" ON "kyoo"."shows" USING btree ("kind",("external_id" -> 'tvdb' -> 0 ->> 'dataId'));--> statement-breakpoint
CREATE UNIQUE INDEX "show_imdb_id" ON "kyoo"."shows" USING btree ("kind",("external_id" -> 'imdb' -> 0 ->> 'dataId'));
