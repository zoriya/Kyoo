import { relations, sql } from "drizzle-orm";
import {
	type AnyPgColumn,
	check,
	date,
	index,
	integer,
	jsonb,
	primaryKey,
	smallint,
	text,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import type { Image, Original } from "~/models/utils";
import { timestamp } from "../utils";
import { entries } from "./entries";
import { seasons } from "./seasons";
import { roles } from "./staff";
import { showStudioJoin } from "./studios";
import { externalid, image, language, schema } from "./utils";

export const showKind = schema.enum("show_kind", [
	"serie",
	"movie",
	"collection",
]);
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

type OriginalWithImages = Original & {
	poster?: Image | null;
	thumbnail?: Image | null;
	banner?: Image | null;
	logo?: Image | null;
};

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
		original: jsonb().$type<OriginalWithImages>().notNull(),

		collectionPk: integer().references((): AnyPgColumn => shows.pk, {
			onDelete: "set null",
		}),
		entriesCount: integer().notNull(),
		availableCount: integer().notNull().default(0),

		externalId: externalid(),

		createdAt: timestamp({ withTimezone: true, mode: "iso" })
			.notNull()
			.default(sql`now()`),
		updatedAt: timestamp({ withTimezone: true, mode: "iso" })
			.notNull()
			.$onUpdate(() => sql`now()`),
		nextRefresh: timestamp({ withTimezone: true, mode: "iso" }).notNull(),
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

export const showsRelations = relations(shows, ({ many }) => ({
	translations: many(showTranslations, { relationName: "show_translations" }),
	entries: many(entries, { relationName: "show_entries" }),
	seasons: many(seasons, { relationName: "show_seasons" }),
	studios: many(showStudioJoin, { relationName: "ssj_show" }),
	staff: many(roles, { relationName: "show_roles" }),
}));
export const showsTrRelations = relations(showTranslations, ({ one }) => ({
	show: one(shows, {
		relationName: "show_translations",
		fields: [showTranslations.pk],
		references: [shows.pk],
	}),
}));
