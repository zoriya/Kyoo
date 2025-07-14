import { relations, sql } from "drizzle-orm";
import {
	check,
	date,
	index,
	integer,
	jsonb,
	primaryKey,
	real,
	text,
	unique,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import { timestamp } from "../utils";
import { shows } from "./shows";
import { image, language, schema } from "./utils";
import { entryVideoJoin } from "./videos";

export const entryType = schema.enum("entry_type", [
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
		showPk: integer()
			.notNull()
			.references(() => shows.pk, { onDelete: "cascade" }),
		order: real(),
		seasonNumber: integer(),
		episodeNumber: integer(),
		kind: entryType().notNull(),
		// only when kind=extra
		extraKind: text(),
		airDate: date(),
		runtime: integer(),
		thumbnail: image(),

		externalId: entry_extid(),

		createdAt: timestamp({ withTimezone: true, mode: "iso" })
			.notNull()
			.default(sql`now()`),
		updatedAt: timestamp({ withTimezone: true, mode: "iso" })
			.notNull()
			.$onUpdate(() => sql`now()`),
		availableSince: timestamp({ withTimezone: true, mode: "iso" }),
		nextRefresh: timestamp({ withTimezone: true, mode: "iso" }).notNull(),
	},
	(t) => [
		unique().on(t.showPk, t.seasonNumber, t.episodeNumber),
		check("order_positive", sql`${t.order} >= 0`),

		index("entry_kind").using("hash", t.kind),
		index("entry_order").on(t.order),
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
	(t) => [
		primaryKey({ columns: [t.pk, t.language] }),
		index("entry_name_trgm").using("gin", sql`${t.name} gin_trgm_ops`),
	],
);

export const entryRelations = relations(entries, ({ one, many }) => ({
	translations: many(entryTranslations, { relationName: "entry_translations" }),
	evj: many(entryVideoJoin, { relationName: "evj_entry" }),
	show: one(shows, {
		relationName: "show_entries",
		fields: [entries.showPk],
		references: [shows.pk],
	}),
}));

export const entryTrRelations = relations(entryTranslations, ({ one }) => ({
	entry: one(entries, {
		relationName: "entry_translations",
		fields: [entryTranslations.pk],
		references: [entries.pk],
	}),
}));
