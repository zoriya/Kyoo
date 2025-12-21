CREATE TYPE "kyoo"."img_status" AS ENUM('pending', 'link', 'ready');--> statement-breakpoint
CREATE TABLE "kyoo"."images" (
	"pk" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "kyoo"."images_pk_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"id" varchar(256) NOT NULL,
	"url" text NOT NULL,
	"blurhash" varchar(256),
	"targets" jsonb NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"attempt" integer DEFAULT 0 NOT NULL,
	"status" "kyoo"."img_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"downloaded_at" timestamp with time zone,
	CONSTRAINT "images_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE INDEX "imgqueue_sort" ON "kyoo"."images" USING btree ("priority","attempt","created_at");