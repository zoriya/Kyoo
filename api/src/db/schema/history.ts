import { index, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import type { Progress } from "~/models/watchlist";
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
		progress: jsonb().$type<Progress>(),
		playedDate: timestamp({ mode: "string" }).notNull().defaultNow(),
	},
	(t) => [index("history_play_date").on(t.playedDate.desc())],
);
