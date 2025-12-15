import { sql } from "drizzle-orm";
import { check, index, integer } from "drizzle-orm/pg-core";
import { profiles } from "./profiles";
import { schema, timestamp } from "./utils";
import { videos } from "./videos";

export const history = schema.table(
	"history",
	{
		pk: integer().primaryKey().generatedAlwaysAsIdentity(),
		profilePk: integer()
			.notNull()
			.references(() => profiles.pk, { onDelete: "cascade" }),
		videoPk: integer().notNull().references(() => videos.pk, { onDelete: "cascade" }),
		percent: integer().notNull().default(0),
		time: integer().notNull().default(0),
		playedDate: timestamp({ withTimezone: true, mode: "iso" })
			.notNull()
			.default(sql`now()`),
	},
	(t) => [
		index("history_play_date").on(t.playedDate.desc()),

		check("percent_valid", sql`${t.percent} between 0 and 100`),
	],
);
