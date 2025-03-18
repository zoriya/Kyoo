CREATE TABLE "kyoo"."mqueue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" varchar(255) NOT NULL,
	"message" jsonb NOT NULL,
	"attempt" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "mqueue_created" ON "kyoo"."mqueue" USING btree ("created_at");