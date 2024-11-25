import { sql } from "drizzle-orm";
import {
	check,
	integer,
	jsonb,
	text,
	timestamp,
	uuid,
	varchar,
	primaryKey,
} from "drizzle-orm/pg-core";
import { schema } from "./utils";
import { entries } from "./entries";

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

export const entryVideoJointure = schema.table(
	"entry_video_jointure",
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
