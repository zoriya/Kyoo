import { sql } from "drizzle-orm";
import {
	check,
	integer,
	jsonb,
	text,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import { schema } from "./utils";

export const videos = schema.table(
	"videos",
	{
		pk: integer().primaryKey().generatedAlwaysAsIdentity(),
		id: uuid().notNull().unique().defaultRandom(),
		slug: varchar({ length: 255 }).notNull().unique(),
		path: text().notNull().unique(),
		rendering: text().notNull(),
		part: integer(),
		version: integer().notNull().default(1),
		guess: jsonb().notNull().default({}),

		createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
	},
	(t) => [
		check("part_pos", sql`${t.part} >= 0`),
		check("version_pos", sql`${t.version} >= 0`),
	],
);
