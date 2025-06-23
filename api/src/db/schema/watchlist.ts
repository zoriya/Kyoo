import { sql } from "drizzle-orm";
import { check, integer, primaryKey } from "drizzle-orm/pg-core";
import { timestamp } from "../utils";
import { entries } from "./entries";
import { profiles } from "./profiles";
import { shows } from "./shows";
import { schema } from "./utils";

export const watchlistStatus = schema.enum("watchlist_status", [
	"watching",
	"rewatching",
	"completed",
	"dropped",
	"planned",
]);

export const watchlist = schema.table(
	"watchlist",
	{
		profilePk: integer()
			.notNull()
			.references(() => profiles.pk, { onDelete: "cascade" }),
		showPk: integer()
			.notNull()
			.references(() => shows.pk, { onDelete: "cascade" }),

		status: watchlistStatus().notNull(),
		seenCount: integer().notNull().default(0),
		nextEntry: integer().references(() => entries.pk, { onDelete: "set null" }),

		score: integer(),

		startedAt: timestamp({ withTimezone: true, mode: "iso" }),
		lastPlayedAt: timestamp({ withTimezone: true, mode: "iso" }),
		completedAt: timestamp({ withTimezone: true, mode: "iso" }),

		createdAt: timestamp({ withTimezone: true, mode: "iso" })
			.notNull()
			.default(sql`now()`),
		updatedAt: timestamp({ withTimezone: true, mode: "iso" })
			.notNull()
			.$onUpdate(() => sql`now()`),
	},
	(t) => [
		primaryKey({ columns: [t.profilePk, t.showPk] }),
		check("score_percent", sql`${t.score} between 0 and 100`),
	],
);
