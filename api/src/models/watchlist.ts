import { t } from "elysia";

export const WatchlistStatus = t.UnionEnum([
	"completed",
	"watching",
	"rewatching",
	"dropped",
	"planned",
]);
export type WatchlistStatus = typeof WatchlistStatus.static;

export const SerieWatchStatus = t.Object({
	status: WatchlistStatus,
	score: t.Nullable(t.Integer({ minimum: 0, maximum: 100 })),
	startedAt: t.Nullable(t.String({ format: "date-time" })),
	completedAt: t.Nullable(t.String({ format: "date-time" })),
	seenCount: t.Integer({
		description: "The number of episodes you watched in this serie.",
		minimum: 0,
	}),
});
export type SerieWatchStatus = typeof SerieWatchStatus.static;

export const MovieWatchStatus = t.Composite([
	t.Omit(SerieWatchStatus, ["startedAt", "seenCount"]),
	t.Object({
		percent: t.Integer({
			minimum: 0,
			maximum: 100,
		}),
	}),
]);
export type MovieWatchStatus = typeof MovieWatchStatus.static;
