import { t } from "elysia";

export const WatchlistStatus = t.UnionEnum([
	"completed",
	"watching",
	"rewatching",
	"dropped",
	"planned",
]);
export type WatchlistStatus = typeof WatchlistStatus.static;

export const WatchStatusSync = t.Object({
	status: t.UnionEnum(["synced", "failed"]),
	lastAttempt: t.Date(),
	lastSuccess: t.Date(),
	error: t.Nullable(t.String()),
});
export type WatchStatusSync = typeof WatchStatusSync.static;

export const SerieWatchStatus = t.Object({
	status: WatchlistStatus,
	score: t.Nullable(t.Integer({ minimum: 0, maximum: 100 })),
	startedAt: t.Nullable(t.Date()),
	completedAt: t.Nullable(t.Date()),
	seenCount: t.Integer({
		description: "The number of episodes you watched in this serie.",
		minimum: 0,
	}),

	syncStatus: t.Optional(t.Record(t.String(), WatchStatusSync))
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

	syncStatus: t.Optional(t.Record(t.String(), WatchStatusSync))
});
export type MovieWatchStatus = typeof MovieWatchStatus.static;

export const WatchStatus = t.Union([SerieWatchStatus, MovieWatchStatus]);
export type WatchStatus = typeof WatchStatus.static;

export const SeedSerieWatchStatus = t.Object({
	status: SerieWatchStatus.properties.status,
	score: t.Optional(SerieWatchStatus.properties.score),
	startedAt: t.Optional(SerieWatchStatus.properties.startedAt),
	completedAt: t.Optional(SerieWatchStatus.properties.completedAt),
});
export type SeedSerieWatchStatus = typeof SeedSerieWatchStatus.static;

export const SeedMovieWatchStatus = t.Omit(SeedSerieWatchStatus, ["startedAt"]);
export type SeedMovieWatchStatus = typeof SeedMovieWatchStatus.static;
