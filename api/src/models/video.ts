import { t } from "elysia";
import { Movie } from "./movie";
import { bubble } from "./examples";

export const Video = t.Object({
	id: t.String({ format: "uuid" }),
	path: t.String(),
	rendering: t.Number({ minimum: 0 }),
	part: t.Number({ minimum: 0 }),
	version: t.Number({ minimum: 0 }),

	createdAt: t.String({ format: "date-time" }),
});

export type Video = typeof Video.static;

Video.examples = [bubble];

export const CompleteVideo = t.Intersect([
	Video,
	t.Union([
		t.Object({
			movie: Movie,
		}),
		t.Object({
			// TODO: implement that
			episodes: t.Array(t.Object({})),
		}),
	]),
]);

export type CompleteVideo = typeof CompleteVideo.static;
