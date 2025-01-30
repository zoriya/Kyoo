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
		guess: jsonb().notNull().default({}),

		createdAt: timestamp({ withTimezone: true, mode: "string" })
			.notNull()
			.defaultNow(),
	},
	(t) => [
		check("part_pos", sql`${t.part} >= 0`),
		check("version_pos", sql`${t.version} >= 0`),
	],
);

export const entryVideoJoin = schema.table(
	"entry_video_join",
	{
		entry: integer()
			.notNull()
			.references(() => entries.pk, { onDelete: "cascade" }),
		video: integer()
			.notNull()
			.references(() => videos.pk, { onDelete: "cascade" }),
		slug: varchar({ length: 255 }).notNull().unique(),
	},
	(t) => [primaryKey({ columns: [t.entry, t.video] })],
);

export const videosRelations = relations(videos, ({ many }) => ({
	evj: many(entryVideoJoin, {
		relationName: "evj_video",
	}),
}));

export const evjRelations = relations(entryVideoJoin, ({ one }) => ({
	video: one(videos, {
		relationName: "evj_video",
		fields: [entryVideoJoin.video],
		references: [videos.pk],
	}),
	entry: one(entries, {
		relationName: "evj_entry",
		fields: [entryVideoJoin.entry],
		references: [entries.pk],
	}),
}));
