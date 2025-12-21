import { sql } from "drizzle-orm";
import { index, integer, jsonb, text, varchar } from "drizzle-orm/pg-core";
import { schema, timestamp } from "./utils";

export const imgStatus = schema.enum("img_status", [
	"pending",
	"link",
	"ready",
]);

export const images = schema.table(
	"images",
	{
		pk: integer().primaryKey().generatedAlwaysAsIdentity(),
		id: varchar({ length: 256 }).notNull().unique(),
		url: text().notNull(),
		blurhash: varchar({ length: 256 }),
		targets: jsonb().$type<{ table: string; column: string }[]>().notNull(),
		priority: integer().notNull().default(0),
		attempt: integer().notNull().default(0),
		status: imgStatus().notNull().default("pending"),
		createdAt: timestamp({ withTimezone: true, mode: "iso" })
			.notNull()
			.default(sql`now()`),
		downloadedAt: timestamp({ withTimezone: true, mode: "iso" }),
	},
	(t) => [index("imgqueue_sort").on(t.priority, t.attempt, t.createdAt)],
);
