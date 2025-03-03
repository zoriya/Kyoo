CREATE TABLE "kyoo"."show_studio_join" (
	"show" integer NOT NULL,
	"studio" integer NOT NULL,
	CONSTRAINT "show_studio_join_show_studio_pk" PRIMARY KEY("show","studio")
);
--> statement-breakpoint
CREATE TABLE "kyoo"."studio_translations" (
	"pk" integer NOT NULL,
	"language" varchar(255) NOT NULL,
	"name" text NOT NULL,
	"logo" jsonb,
	CONSTRAINT "studio_translations_pk_language_pk" PRIMARY KEY("pk","language")
);
--> statement-breakpoint
CREATE TABLE "kyoo"."studios" (
	"pk" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "kyoo"."studios_pk_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(255) NOT NULL,
	"external_id" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "studios_id_unique" UNIQUE("id"),
	CONSTRAINT "studios_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "kyoo"."entries" ADD COLUMN "updated_at" timestamp with time zone NOT NULL;--> statement-breakpoint
ALTER TABLE "kyoo"."seasons" ADD COLUMN "updated_at" timestamp with time zone NOT NULL;--> statement-breakpoint
ALTER TABLE "kyoo"."shows" ADD COLUMN "updated_at" timestamp with time zone NOT NULL;--> statement-breakpoint
ALTER TABLE "kyoo"."videos" ADD COLUMN "updated_at" timestamp with time zone NOT NULL;--> statement-breakpoint
ALTER TABLE "kyoo"."show_studio_join" ADD CONSTRAINT "show_studio_join_show_shows_pk_fk" FOREIGN KEY ("show") REFERENCES "kyoo"."shows"("pk") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kyoo"."show_studio_join" ADD CONSTRAINT "show_studio_join_studio_studios_pk_fk" FOREIGN KEY ("studio") REFERENCES "kyoo"."studios"("pk") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kyoo"."studio_translations" ADD CONSTRAINT "studio_translations_pk_studios_pk_fk" FOREIGN KEY ("pk") REFERENCES "kyoo"."studios"("pk") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "studio_name_trgm" ON "kyoo"."studio_translations" USING gin ("name" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "entry_kind" ON "kyoo"."entries" USING hash ("kind");--> statement-breakpoint
CREATE INDEX "entry_order" ON "kyoo"."entries" USING btree ("order");--> statement-breakpoint
CREATE INDEX "entry_name_trgm" ON "kyoo"."entry_translations" USING gin ("name" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "season_name_trgm" ON "kyoo"."season_translations" USING gin ("name" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "season_nbr" ON "kyoo"."seasons" USING btree ("season_number");