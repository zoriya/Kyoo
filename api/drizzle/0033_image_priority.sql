DROP INDEX "kyoo"."imgqueue_sort";--> statement-breakpoint
CREATE INDEX "imgqueue_sort" ON "kyoo"."images" USING btree ("priority" DESC NULLS LAST,"attempt","created_at");