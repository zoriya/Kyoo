import { sql } from "drizzle-orm";
import {
	check,
	date,
	integer,
	jsonb,
	pgEnum,
	pgTable,
	primaryKey,
	text,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";

export const entryType = pgEnum("entry_type", ["unknown", "episode", "movie", "special", "extra"]);

export const entries = pgTable(
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
		nextRefresh: date(),
		externalId: jsonb().notNull().default({}),
	},
	(t) => ({
		// episodeKey: unique().on(t.showId, t.seasonNumber, t.episodeNumber),
		orderPositive: check("orderPositive", sql`${t.order} >= 0`),
	}),
);

export const entriesTranslation = pgTable(
	"entries_translation",
	{
		pk: integer()
			.notNull()
			.references(() => entries.id),
		language: varchar({ length: 255 }).notNull(),
		name: text(),
		description: text(),
	},
	(t) => ({
		pk: primaryKey({ columns: [t.pk, t.language] }),
	}),
);
