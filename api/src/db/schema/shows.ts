import { relations, type SQL, sql } from "drizzle-orm";
import {
	check,
	date,
	index,
	integer,
	jsonb,
	primaryKey,
	smallint,
	text,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import { image, language, schema, tsvector } from "./utils";

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

export const externalid = () =>
	jsonb()
		.$type<
			Record<
				string,
				{
					dataId: string;
					link: string | null;
				}
			>
		>()
		.notNull()
		.default({});

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

		index("kind").using("hash", t.kind),
		index("rating").on(t.rating),
		index("startAir").on(t.startAir),
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
		poster: image(),
		thumbnail: image(),
		banner: image(),
		logo: image(),
		trailerUrl: text(),

		// TODO: use a real language instead of simple here (we could use the `language` column but dic names
		// are `english` and not `en`.)
		// we'll also need to handle fallback when the language has no dict available on pg.
		search: tsvector().generatedAlwaysAs((): SQL => sql`
			setweight(to_tsvector('simple', ${showTranslations.name}), 'A') ||
			setweight(to_tsvector('simple', array_to_string_im(${showTranslations.aliases}, ' ')), 'B') ||
			setweight(to_tsvector('simple', array_to_string_im(${showTranslations.tags}, ' ')), 'C') ||
			setweight(to_tsvector('simple', coalesce(${showTranslations.tagline}, '')), 'D') ||
			setweight(to_tsvector('simple', coalesce(${showTranslations.description}, '')), 'D')
		`),
	},
	(t) => [
		primaryKey({ columns: [t.pk, t.language] }),
		index("search").using("gin", t.search),
	],
);

export const showsRelations = relations(shows, ({ many, one }) => ({
	selectedTranslation: many(showTranslations, {
		relationName: "selectedTranslation",
	}),
	translations: many(showTranslations, { relationName: "showTranslations" }),
	originalTranslation: one(showTranslations, {
		relationName: "originalTranslation",
		fields: [shows.pk, shows.originalLanguage],
		references: [showTranslations.pk, showTranslations.language],
	}),
}));
export const showsTrRelations = relations(showTranslations, ({ one }) => ({
	show: one(shows, {
		relationName: "showTranslations",
		fields: [showTranslations.pk],
		references: [shows.pk],
	}),
	selectedTranslation: one(shows, {
		relationName: "selectedTranslation",
		fields: [showTranslations.pk],
		references: [shows.pk],
	}),
	originalTranslation: one(shows, {
		relationName: "originalTranslation",
		fields: [showTranslations.pk, showTranslations.language],
		references: [shows.pk, shows.originalLanguage],
	}),
}));
