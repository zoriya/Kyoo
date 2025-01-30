import { relations, sql } from "drizzle-orm";
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
import { entries } from "./entries";
import { seasons } from "./seasons";
import { image, language, schema } from "./utils";

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
	},
	(t) => [
		primaryKey({ columns: [t.pk, t.language] }),
		index("name_trgm").using("gin", sql`${t.name} gin_trgm_ops`),
		index("tags").on(t.tags),
	],
);

export const showsRelations = relations(shows, ({ many, one }) => ({
	selectedTranslation: many(showTranslations, {
		relationName: "selected_translation",
	}),
	translations: many(showTranslations, { relationName: "show_translations" }),
	originalTranslation: one(showTranslations, {
		relationName: "original_translation",
		fields: [shows.pk, shows.originalLanguage],
		references: [showTranslations.pk, showTranslations.language],
	}),
	entries: many(entries, { relationName: "show_entries" }),
	seasons: many(seasons, { relationName: "show_seasons" }),
}));
export const showsTrRelations = relations(showTranslations, ({ one }) => ({
	show: one(shows, {
		relationName: "show_translations",
		fields: [showTranslations.pk],
		references: [shows.pk],
	}),
	selectedTranslation: one(shows, {
		relationName: "selected_translation",
		fields: [showTranslations.pk],
		references: [shows.pk],
	}),
	originalTranslation: one(shows, {
		relationName: "original_translation",
		fields: [showTranslations.pk, showTranslations.language],
		references: [shows.pk, shows.originalLanguage],
	}),
}));
