import { sql } from "drizzle-orm";
import {
	check,
	date,
	integer,
	primaryKey,
	smallint,
	text,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import { externalid, image, language, schema } from "./utils";

export const showKind = schema.enum("show_kind", ["serie", "movie"]);
export const showStatus = schema.enum("show_status", [
	"unknown",
	"finished",
	"airing",
	"planned",
]);
export const genres = schema.enum("genres", [
	"action",
	"adventure",
	"animation",
	"comedy",
	"crime",
	"documentary",
	"drama",
	"family",
	"fantasy",
	"history",
	"horror",
	"music",
	"mystery",
	"romance",
	"science-fiction",
	"thriller",
	"war",
	"western",
	"kids",
	"reality",
	"politics",
	"soap",
	"talk",
]);

export const shows = schema.table(
	"shows",
	{
		pk: integer().primaryKey().generatedAlwaysAsIdentity(),
		id: uuid().notNull().unique().defaultRandom(),
		slug: varchar({ length: 255 }).notNull().unique(),
		kind: showKind().notNull(),
		genres: genres().array().notNull(),
		rating: smallint(),
		runtime: integer(),
		status: showStatus().notNull(),
		startAir: date(),
		endAir: date(),
		originalLanguage: language(),

		externalId: externalid(),

		createdAt: timestamp({ withTimezone: true, mode: "string" })
			.notNull()
			.defaultNow(),
		nextRefresh: timestamp({ withTimezone: true, mode: "string" }).notNull(),
	},
	(t) => [
		check("rating_valid", sql`${t.rating} between 0 and 100`),
		check("runtime_valid", sql`${t.runtime} >= 0`),
	],
);

export const showTranslations = schema.table(
	"show_translations",
	{
		pk: integer()
			.notNull()
			.references(() => shows.pk, { onDelete: "cascade" }),
		language: language().notNull(),
		name: text().notNull(),
		description: text(),
		tagline: text(),
		aliases: text().array().notNull(),
		tags: text().array().notNull(),
		trailerUrl: text(),
		poster: image(),
		thumbnail: image(),
		banner: image(),
		logo: image(),
	},
	(t) => [primaryKey({ columns: [t.pk, t.language] })],
);
