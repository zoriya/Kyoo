import { sql } from "drizzle-orm";
import { boolean, check, index, integer, timestamp } from "drizzle-orm/pg-core";
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
		// we need to attach an history to an entry because we want to keep history
		// when we delete a video file
		entryPk: integer()
			.notNull()
			.references(() => entries.pk, { onDelete: "cascade" }),
		videoPk: integer().references(() => videos.pk, { onDelete: "set null" }),
		percent: integer().notNull().default(0),
		time: integer().notNull().default(0),
		playedDate: timestamp({ withTimezone: true, precision: 3 })
			.notNull()
			.defaultNow(),
		// true if the user only marked the entry has seen and has not seen it on kyoo
		external: boolean().notNull(),
	},
	(t) => [
		index("history_play_date").on(t.playedDate.desc()),
		index("history_profile_play_date").on(t.profilePk, t.playedDate.desc()),
		index("history_profile_entry").on(
			t.profilePk,
			t.entryPk,
			t.playedDate.desc(),
		),

		check("percent_valid", sql`${t.percent} between 0 and 100`),
	],
);
