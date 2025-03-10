CREATE TYPE "kyoo"."role_kind" AS ENUM('actor', 'director', 'writter', 'producer', 'music', 'other');--> statement-breakpoint
CREATE TABLE "kyoo"."roles" (
	"pk" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "kyoo"."roles_pk_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"show_pk" integer NOT NULL,
	"staff_pk" integer NOT NULL,
	"kind" "kyoo"."role_kind" NOT NULL,
	"order" integer NOT NULL,
	"character" jsonb
);
--> statement-breakpoint
CREATE TABLE "kyoo"."staff" (
	"pk" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "kyoo"."staff_pk_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(255) NOT NULL,
	"name" text NOT NULL,
	"latin_name" text,
	"image" jsonb,
	"external_id" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "staff_id_unique" UNIQUE("id"),
	CONSTRAINT "staff_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "kyoo"."roles" ADD CONSTRAINT "roles_show_pk_shows_pk_fk" FOREIGN KEY ("show_pk") REFERENCES "kyoo"."shows"("pk") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kyoo"."roles" ADD CONSTRAINT "roles_staff_pk_staff_pk_fk" FOREIGN KEY ("staff_pk") REFERENCES "kyoo"."staff"("pk") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "role_kind" ON "kyoo"."roles" USING hash ("kind");--> statement-breakpoint
CREATE INDEX "role_order" ON "kyoo"."roles" USING btree ("order");