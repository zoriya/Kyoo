import { t } from "elysia";
import { comment } from "~/utils";

export const Progress = t.Object({
	percent: t.Integer({ minimum: 0, maximum: 100 }),
	time: t.Integer({
		minimum: 0,
		description: comment`
				When this episode was stopped (in seconds since the start).
				This value is null if the entry was never watched or is finished.
			`,
	}),
	playedDate: t.Nullable(t.String({ format: "date-time" })),
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

export const SeedHistory = t.Intersect([
	t.Object({
		entry: t.String({
			description: "Id or slug of the entry/movie you watched",
		}),
	}),
	Progress,
]);
export type SeedHistory = typeof SeedHistory.static;
