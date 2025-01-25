import { sql } from "drizzle-orm";
import {
	check,
	date,
	integer,
	jsonb,
	primaryKey,
	real,
	text,
	timestamp,
	unique,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import { shows } from "./shows";
import { image, language, schema } from "./utils";

export const entryType = schema.enum("entry_type", [
	"unknown",
	"episode",
	"movie",
	"special",
	"extra",
]);

export const entry_extid = () =>
	jsonb()
		.$type<
			Record<
				string,
				| {
						// used for movies
						dataId: string;
						link: string | null;
				  }
				| {
						// used for episodes, specials & extra
						serieId: string;
						season: number | null;
						episode: number;
						link: string | null;
				  }
			>
		>()
		.notNull()
		.default({});

export const entries = schema.table(
	"entries",
	{
		pk: integer().primaryKey().generatedAlwaysAsIdentity(),
		id: uuid().notNull().unique().defaultRandom(),
		slug: varchar({ length: 255 }).notNull().unique(),
		showPk: integer().references(() => shows.pk, { onDelete: "cascade" }),
		order: real(),
		seasonNumber: integer(),
		episodeNumber: integer(),
		type: entryType().notNull(),
		airDate: date(),
		runtime: integer(),
		thumbnails: image(),

		externalId: entry_extid(),

		createdAt: timestamp({ withTimezone: true, mode: "string" })
			.notNull()
			.defaultNow(),
		nextRefresh: timestamp({ withTimezone: true, mode: "string" }).notNull(),
	},
	(t) => [
		unique().on(t.showPk, t.seasonNumber, t.episodeNumber),
		check("order_positive", sql`${t.order} >= 0`),
	],
);

export const entryTranslations = schema.table(
	"entry_translations",
	{
		pk: integer()
			.notNull()
			.references(() => entries.pk, { onDelete: "cascade" }),
		language: language().notNull(),
		name: text(),
		description: text(),
		// those two are only used if kind === "movie"
		tagline: text(),
		poster: image(),
	},
	(t) => [primaryKey({ columns: [t.pk, t.language] })],
);
