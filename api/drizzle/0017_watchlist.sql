CREATE TYPE "kyoo"."watchlist_status" AS ENUM('completed', 'watching', 'rewatching', 'dropped', 'planned');--> statement-breakpoint
CREATE TABLE "kyoo"."history" (
	"pk" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "kyoo"."history_pk_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"profile_pk" integer NOT NULL,
	"entry_pk" integer NOT NULL,
	"video_pk" integer NOT NULL,
	"percent" integer DEFAULT 0 NOT NULL,
	"time" integer,
	"played_date" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "percent_valid" CHECK ("kyoo"."history"."percent" between 0 and 100)
);
--> statement-breakpoint
CREATE TABLE "kyoo"."profiles" (
	"pk" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "kyoo"."profiles_pk_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"id" uuid NOT NULL,
	CONSTRAINT "profiles_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE "kyoo"."watchlist" (
	"profile_pk" integer NOT NULL,
	"show_pk" integer NOT NULL,
	"status" "kyoo"."watchlist_status" NOT NULL,
	"seen_count" integer DEFAULT 0 NOT NULL,
	"next_entry" integer,
	"score" integer,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "watchlist_profile_pk_show_pk_pk" PRIMARY KEY("profile_pk","show_pk"),
	CONSTRAINT "score_percent" CHECK ("kyoo"."watchlist"."score" between 0 and 100)
);
--> statement-breakpoint
ALTER TABLE "kyoo"."history" ADD CONSTRAINT "history_profile_pk_profiles_pk_fk" FOREIGN KEY ("profile_pk") REFERENCES "kyoo"."profiles"("pk") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kyoo"."history" ADD CONSTRAINT "history_entry_pk_entries_pk_fk" FOREIGN KEY ("entry_pk") REFERENCES "kyoo"."entries"("pk") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kyoo"."history" ADD CONSTRAINT "history_video_pk_videos_pk_fk" FOREIGN KEY ("video_pk") REFERENCES "kyoo"."videos"("pk") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kyoo"."watchlist" ADD CONSTRAINT "watchlist_profile_pk_profiles_pk_fk" FOREIGN KEY ("profile_pk") REFERENCES "kyoo"."profiles"("pk") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kyoo"."watchlist" ADD CONSTRAINT "watchlist_show_pk_shows_pk_fk" FOREIGN KEY ("show_pk") REFERENCES "kyoo"."shows"("pk") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kyoo"."watchlist" ADD CONSTRAINT "watchlist_next_entry_entries_pk_fk" FOREIGN KEY ("next_entry") REFERENCES "kyoo"."entries"("pk") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "history_play_date" ON "kyoo"."history" USING btree ("played_date" DESC NULLS LAST);