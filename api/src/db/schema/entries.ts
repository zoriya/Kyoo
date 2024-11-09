import { sql } from "drizzle-orm";
import {
	check,
	date,
	integer,
	jsonb,
	primaryKey,
	text,
	timestamp,
	unique,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import { image, language, schema } from "./utils";
import { shows } from "./shows";

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
		showPk: integer().references(() => shows.pk, { onDelete: "cascade" }),
		order: integer(),
		seasonNumber: integer(),
		episodeNumber: integer(),
		type: entryType().notNull(),
		airDate: date(),
		runtime: integer(),
		thumbnails: image(),

		externalId: jsonb().notNull().default({}),

		createdAt: timestamp({ withTimezone: true, mode: "string" }).defaultNow(),
		nextRefresh: timestamp({ withTimezone: true, mode: "string" }),
	},
	(t) => [
		unique().on(t.showPk, t.seasonNumber, t.episodeNumber),
		check("order_positive", sql`${t.order} >= 0`),
	],
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
	(t) => [primaryKey({ columns: [t.pk, t.language] })],
);
