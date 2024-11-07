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
	(t) => ({
		ratingValid: check("renderingPos", sql`0 <= ${t.rendering}`),
		partValid: check("partPos", sql`0 <= ${t.part}`),
		versionValid: check("versionPos", sql`0 <= ${t.version}`),
	}),
);
