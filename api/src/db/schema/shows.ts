import { sql } from "drizzle-orm";
import {
	check,
	date,
	integer,
	jsonb,
	primaryKey,
	smallint,
	text,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import { language, schema } from "./utils";

export const showKind = schema.enum("show_kind", ["serie", "movie"]);
export const showStatus = schema.enum("show_status", ["unknown", "finished", "airing", "planned"]);
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
		status: showStatus().notNull(),
		startAir: date(),
		endAir: date(),
		originalLanguage: language(),

		externalId: jsonb().notNull().default({}),

		createdAt: timestamp({ withTimezone: true }),
		nextRefresh: timestamp({ withTimezone: true }),
	},
	(t) => ({
		ratingValid: check("ratingValid", sql`0 <= ${t.rating} && ${t.rating} <= 100`),
	}),
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
		poster: jsonb(),
		thumbnail: jsonb(),
		banner: jsonb(),
		logo: jsonb(),
	},
	(t) => ({
		pk: primaryKey({ columns: [t.pk, t.language] }),
	}),
);
