import { t } from "elysia";
import { comment } from "~/utils";

export const Progress = t.Object({
	percent: t.Integer({ minimum: 0, maximum: 100 }),
	time: t.Nullable(
		t.Integer({
			minimum: 0,
			description: comment`
				When this episode was stopped (in seconds since the start).
				This value is null if the entry was never watched or is finished.
			`,
		}),
	),
	videoId: t.Nullable(
		t.String({
			format: "uuid",
			description: comment`
				Id of the video the user watched.
				This can be used to resume playback in the correct video file
				without asking the user what video to play.

				This will be null if the user did not watch the entry or
				if the video was deleted since.
			`,
		}),
	),
});
export type Progress = typeof Progress.static;

export const WatchlistStatus = t.UnionEnum([
	"completed",
	"watching",
	"rewatching",
	"dropped",
	"planned",
]);

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

export const MovieWatchStatus = t.Intersect([
	t.Omit(SerieWatchStatus, ["startedAt", "seenCount"]),
	t.Object({
		percent: t.Integer({
			minimum: 0,
			maximum: 100,
		}),
	}),
]);
export type MovieWatchStatus = typeof MovieWatchStatus.static;
