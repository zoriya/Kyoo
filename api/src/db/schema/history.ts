import { sql } from "drizzle-orm";
import { check, index, integer, timestamp } from "drizzle-orm/pg-core";
import { entries } from "./entries";
import { profiles } from "./profiles";
import { schema } from "./utils";
import { videos } from "./videos";

export const history = schema.table(
	"history",
	{
		pk: integer().primaryKey().generatedAlwaysAsIdentity(),
		profilePk: integer()
			.notNull()
			.references(() => profiles.pk, { onDelete: "cascade" }),
		entryPk: integer()
			.notNull()
			.references(() => entries.pk, { onDelete: "cascade" }),
		videoPk: integer()
			.notNull()
			.references(() => videos.pk, { onDelete: "set null" }),
		percent: integer().notNull().default(0),
		time: integer(),
		playedDate: timestamp({ withTimezone: true, mode: "string" })
			.notNull()
			.defaultNow(),
	},
	(t) => [
		index("history_play_date").on(t.playedDate.desc()),

		check("percent_valid", sql`${t.percent} between 0 and 100`),
	],
);
