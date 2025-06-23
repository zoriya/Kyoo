import { sql } from "drizzle-orm";
import { index, integer, jsonb, uuid, varchar } from "drizzle-orm/pg-core";
import { timestamp } from "../utils";
import { schema } from "./utils";

export const mqueue = schema.table(
	"mqueue",
	{
		id: uuid().notNull().primaryKey().defaultRandom(),
		kind: varchar({ length: 255 }).notNull(),
		message: jsonb().notNull(),
		attempt: integer().notNull().default(0),
		createdAt: timestamp({ withTimezone: true, mode: "iso" })
			.notNull()
			.default(sql`now()`),
	},
	(t) => [index("mqueue_created").on(t.createdAt)],
);
