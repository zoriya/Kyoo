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

export const MovieWatchStatus = t.Object({
	status: WatchlistStatus,
	score: SerieWatchStatus.properties.score,
	completedAt: SerieWatchStatus.properties.completedAt,
	percent: t.Integer({
		minimum: 0,
		maximum: 100,
	}),
});
export type MovieWatchStatus = typeof MovieWatchStatus.static;

export const SeedSerieWatchStatus = t.Object({
	status: SerieWatchStatus.properties.status,
	score: t.Optional(SerieWatchStatus.properties.score),
	startedAt: t.Optional(SerieWatchStatus.properties.startedAt),
	completedAt: t.Optional(SerieWatchStatus.properties.completedAt),
});
export type SeedSerieWatchStatus = typeof SeedSerieWatchStatus.static;

export const SeedMovieWatchStatus = t.Omit(SeedSerieWatchStatus, ["startedAt"]);
export type SeedMovieWatchStatus = typeof SeedMovieWatchStatus.static;
