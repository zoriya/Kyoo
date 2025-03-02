import { sql } from "drizzle-orm";
import {
	index,
	integer,
	primaryKey,
	text,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import { externalid, shows } from "./shows";
import { image, language, schema } from "./utils";

export const studios = schema.table("studios", {
	pk: integer().primaryKey().generatedAlwaysAsIdentity(),
	id: uuid().notNull().unique().defaultRandom(),
	slug: varchar({ length: 255 }).notNull().unique(),
	externalId: externalid(),

	createdAt: timestamp({ withTimezone: true, mode: "string" })
		.notNull()
		.defaultNow(),
	updatedAt: timestamp({ withTimezone: true, mode: "string" })
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
		show: integer()
			.notNull()
			.references(() => shows.pk, { onDelete: "cascade" }),
		studio: integer()
			.notNull()
			.references(() => studios.pk, { onDelete: "cascade" }),
	},
	(t) => [primaryKey({ columns: [t.show, t.studio] })],
);
