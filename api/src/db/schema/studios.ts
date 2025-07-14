import { relations, sql } from "drizzle-orm";
import {
	index,
	integer,
	primaryKey,
	text,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import { timestamp } from "../utils";
import { shows } from "./shows";
import { externalid, image, language, schema } from "./utils";

export const studios = schema.table("studios", {
	pk: integer().primaryKey().generatedAlwaysAsIdentity(),
	id: uuid().notNull().unique().defaultRandom(),
	slug: varchar({ length: 255 }).notNull().unique(),
	externalId: externalid(),

	createdAt: timestamp({ withTimezone: true, mode: "iso" })
		.notNull()
		.default(sql`now()`),
	updatedAt: timestamp({ withTimezone: true, mode: "iso" })
		.notNull()
		.$onUpdate(() => sql`now()`),
});

export const studioTranslations = schema.table(
	"studio_translations",
	{
		pk: integer()
			.notNull()
			.references(() => studios.pk, { onDelete: "cascade" }),
		language: language().notNull(),
		name: text().notNull(),
		logo: image(),
	},
	(t) => [
		primaryKey({ columns: [t.pk, t.language] }),
		index("studio_name_trgm").using("gin", sql`${t.name} gin_trgm_ops`),
	],
);

export const showStudioJoin = schema.table(
	"show_studio_join",
	{
		showPk: integer()
			.notNull()
			.references(() => shows.pk, { onDelete: "cascade" }),
		studioPk: integer()
			.notNull()
			.references(() => studios.pk, { onDelete: "cascade" }),
	},
	(t) => [primaryKey({ columns: [t.showPk, t.studioPk] })],
);

export const studioRelations = relations(studios, ({ many }) => ({
	translations: many(studioTranslations, {
		relationName: "studio_translations",
	}),
	selectedTranslation: many(studioTranslations, {
		relationName: "studio_selected_translation",
	}),
	showsJoin: many(showStudioJoin, { relationName: "ssj_studio" }),
}));
export const studioTrRelations = relations(studioTranslations, ({ one }) => ({
	studio: one(studios, {
		relationName: "studio_translations",
		fields: [studioTranslations.pk],
		references: [studios.pk],
	}),
	selectedTranslation: one(studios, {
		relationName: "studio_selected_translation",
		fields: [studioTranslations.pk],
		references: [studios.pk],
	}),
}));
export const ssjRelations = relations(showStudioJoin, ({ one }) => ({
	show: one(shows, {
		relationName: "ssj_show",
		fields: [showStudioJoin.showPk],
		references: [shows.pk],
	}),
	studio: one(studios, {
		relationName: "ssj_studio",
		fields: [showStudioJoin.studioPk],
		references: [studios.pk],
	}),
}));
