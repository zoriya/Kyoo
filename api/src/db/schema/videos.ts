import { relations, sql } from "drizzle-orm";
import {
	check,
	integer,
	jsonb,
	primaryKey,
	text,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import type { Guess } from "~/models/video";
import { entries } from "./entries";
import { schema } from "./utils";

export const videos = schema.table(
	"videos",
	{
		pk: integer().primaryKey().generatedAlwaysAsIdentity(),
		id: uuid().notNull().unique().defaultRandom(),
		path: text().notNull().unique(),
		rendering: text().notNull(),
		part: integer(),
		version: integer().notNull().default(1),
		guess: jsonb().$type<Guess>().notNull(),

		createdAt: timestamp({ withTimezone: true, mode: "string" })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp({ withTimezone: true, mode: "string" })
			.notNull()
			.$onUpdate(() => sql`now()`),
	},
	(t) => [
		check("part_pos", sql`${t.part} >= 0`),
		check("version_pos", sql`${t.version} >= 0`),
	],
);

export const entryVideoJoin = schema.table(
	"entry_video_join",
	{
		entryPk: integer()
			.notNull()
			.references(() => entries.pk, { onDelete: "cascade" }),
		videoPk: integer()
			.notNull()
			.references(() => videos.pk, { onDelete: "cascade" }),
		slug: varchar({ length: 255 }).notNull().unique(),
	},
	(t) => [primaryKey({ columns: [t.entryPk, t.videoPk] })],
);

export const videosRelations = relations(videos, ({ many }) => ({
	evj: many(entryVideoJoin, {
		relationName: "evj_video",
	}),
}));

export const evjRelations = relations(entryVideoJoin, ({ one }) => ({
	video: one(videos, {
		relationName: "evj_video",
		fields: [entryVideoJoin.videoPk],
		references: [videos.pk],
	}),
	entry: one(entries, {
		relationName: "evj_entry",
		fields: [entryVideoJoin.entryPk],
		references: [entries.pk],
	}),
}));
