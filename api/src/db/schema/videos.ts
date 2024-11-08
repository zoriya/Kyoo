import { sql } from "drizzle-orm";
import { check, integer, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { schema } from "./utils";

export const videos = schema.table(
	"videos",
	{
		pk: integer().primaryKey().generatedAlwaysAsIdentity(),
		id: uuid().notNull().unique().defaultRandom(),
		path: text().notNull().unique(),
		rendering: integer(),
		part: integer(),
		version: integer(),

		createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
	},
	(t) => [
		check("rendering_pos", sql`${t.rendering} >= 0`),
		check("part_pos", sql`${t.part} >= 0`),
		check("version_pos", sql`${t.version} >= 0`),
	],
);
