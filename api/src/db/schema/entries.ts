import { sql } from "drizzle-orm";
import {
	check,
	date,
	integer,
	jsonb,
	primaryKey,
	text,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import { language, schema } from "./utils";

export const entryType = schema.enum("entry_type", [
	"unknown",
	"episode",
	"movie",
	"special",
	"extra",
]);

export const entries = schema.table(
	"entries",
	{
		pk: integer().primaryKey().generatedAlwaysAsIdentity(),
		id: uuid().notNull().unique().defaultRandom(),
		slug: varchar({ length: 255 }).notNull().unique(),
		// showId: integer().references(() => show.id),
		order: integer().notNull(),
		seasonNumber: integer(),
		episodeNumber: integer(),
		type: entryType().notNull(),
		airDate: date(),
		runtime: integer(),
		thumbnails: jsonb(),
		nextRefresh: timestamp({ withTimezone: true }),
		externalId: jsonb().notNull().default({}),
	},
	(t) => ({
		// episodeKey: unique().on(t.showId, t.seasonNumber, t.episodeNumber),
		orderPositive: check("orderPositive", sql`${t.order} >= 0`),
	}),
);

export const entriesTranslation = schema.table(
	"entries_translation",
	{
		pk: integer()
			.notNull()
			.references(() => entries.pk, { onDelete: "cascade" }),
		language: language().notNull(),
		name: text(),
		description: text(),
	},
	(t) => ({
		pk: primaryKey({ columns: [t.pk, t.language] }),
	}),
);
