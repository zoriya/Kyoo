CREATE INDEX "entry_thumbnail_img" ON "kyoo"."entries" USING btree (("thumbnail" ->> 'id'));--> statement-breakpoint
CREATE INDEX "entry_poster_img" ON "kyoo"."entry_translations" USING btree (("poster" ->> 'id'));--> statement-breakpoint
CREATE INDEX "season_poster_img" ON "kyoo"."season_translations" USING btree (("poster" ->> 'id'));--> statement-breakpoint
CREATE INDEX "season_thumbnail_img" ON "kyoo"."season_translations" USING btree (("thumbnail" ->> 'id'));--> statement-breakpoint
CREATE INDEX "season_banner_img" ON "kyoo"."season_translations" USING btree (("banner" ->> 'id'));--> statement-breakpoint
CREATE INDEX "show_poster_img" ON "kyoo"."show_translations" USING btree (("poster" ->> 'id'));--> statement-breakpoint
CREATE INDEX "show_thumbnail_img" ON "kyoo"."show_translations" USING btree (("thumbnail" ->> 'id'));--> statement-breakpoint
CREATE INDEX "show_banner_img" ON "kyoo"."show_translations" USING btree (("banner" ->> 'id'));--> statement-breakpoint
CREATE INDEX "show_logo_img" ON "kyoo"."show_translations" USING btree (("logo" ->> 'id'));--> statement-breakpoint
CREATE INDEX "show_original_poster_img" ON "kyoo"."shows" USING btree (("original"['poster'] ->> 'id'));--> statement-breakpoint
CREATE INDEX "show_original_thumbnail_img" ON "kyoo"."shows" USING btree (("original"['thumbnail'] ->> 'id'));--> statement-breakpoint
CREATE INDEX "show_original_banner_img" ON "kyoo"."shows" USING btree (("original"['banner'] ->> 'id'));--> statement-breakpoint
CREATE INDEX "show_original_logo_img" ON "kyoo"."shows" USING btree (("original"['logo'] ->> 'id'));--> statement-breakpoint
CREATE INDEX "show_backdrop_img" ON "kyoo"."shows" USING btree (("backdrop" ->> 'id'));--> statement-breakpoint
CREATE INDEX "role_character_img" ON "kyoo"."roles" USING btree (("character"['image'] ->> 'id'));--> statement-breakpoint
CREATE INDEX "staff_image_img" ON "kyoo"."staff" USING btree (("image" ->> 'id'));--> statement-breakpoint
CREATE INDEX "studio_logo_img" ON "kyoo"."studio_translations" USING btree (("logo" ->> 'id'));