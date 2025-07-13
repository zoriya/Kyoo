import { relations, sql } from "drizzle-orm";
import {
	date,
	index,
	integer,
	jsonb,
	primaryKey,
	text,
	unique,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import { timestamp } from "../utils";
import { shows } from "./shows";
import { image, language, schema } from "./utils";

export const season_extid = () =>
	jsonb()
		.$type<
			Record<
				string,
				{
					serieId: string;
					season: number;
					link: string | null;
				}
			>
		>()
		.notNull()
		.default({});

export const seasons = schema.table(
	"seasons",
	{
		pk: integer().primaryKey().generatedAlwaysAsIdentity(),
		id: uuid().notNull().unique().defaultRandom(),
		slug: varchar({ length: 255 }).notNull().unique(),
		showPk: integer().references(() => shows.pk, { onDelete: "cascade" }),
		seasonNumber: integer().notNull(),
		startAir: date(),
		endAir: date(),

		entriesCount: integer().notNull(),
		availableCount: integer().notNull().default(0),

		externalId: season_extid(),

		createdAt: timestamp({ withTimezone: true, mode: "iso" })
			.notNull()
			.default(sql`now()`),
		updatedAt: timestamp({ withTimezone: true, mode: "iso" })
			.notNull()
			.$onUpdate(() => sql`now()`),
		nextRefresh: timestamp({ withTimezone: true, mode: "iso" }).notNull(),
	},
	(t) => [
		unique().on(t.showPk, t.seasonNumber),
		index("show_fk").using("hash", t.showPk),
		index("season_nbr").on(t.seasonNumber),
	],
);

export const seasonTranslations = schema.table(
	"season_translations",
	{
		pk: integer()
			.notNull()
			.references(() => seasons.pk, { onDelete: "cascade" }),
		language: language().notNull(),
		name: text(),
		description: text(),
		poster: image(),
		thumbnail: image(),
		banner: image(),
	},
	(t) => [
		primaryKey({ columns: [t.pk, t.language] }),
		index("season_name_trgm").using("gin", sql`${t.name} gin_trgm_ops`),
	],
);

export const seasonRelations = relations(seasons, ({ one, many }) => ({
	translations: many(seasonTranslations, {
		relationName: "season_translations",
	}),
	show: one(shows, {
		relationName: "show_seasons",
		fields: [seasons.showPk],
		references: [shows.pk],
	}),
}));

export const seasonTrRelations = relations(seasonTranslations, ({ one }) => ({
	season: one(seasons, {
		relationName: "season_translation",
		fields: [seasonTranslations.pk],
		references: [seasons.pk],
	}),
}));
