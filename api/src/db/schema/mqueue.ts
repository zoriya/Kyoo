import {
	index,
	integer,
	jsonb,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import { schema } from "./utils";

export const mqueue = schema.table(
	"mqueue",
	{
		id: uuid().notNull().primaryKey().defaultRandom(),
		kind: varchar({ length: 255 }).notNull(),
		message: jsonb().notNull(),
		priority: integer().notNull().default(0),
		attempt: integer().notNull().default(0),
		createdAt: timestamp({ withTimezone: true, precision: 3 })
			.notNull()
			.defaultNow(),
	},
	(t) => [index("mqueue_created").on(t.createdAt)],
);
