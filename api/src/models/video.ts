import { t } from "elysia";
import { Movie } from "./movie";
import { bubble, registerExamples } from "./examples";

export const Video = t.Object({
	id: t.String({ format: "uuid" }),
	path: t.String(),
	rendering: t.Number({ minimum: 0 }),
	part: t.Nullable(t.Number({ minimum: 0 })),
	version: t.Nullable(
		t.Number({
			minimum: 0,
			description:
				"Kyoo will prefer playing back the highest `version` number if there's rendering.",
		}),
	),

	createdAt: t.String({ format: "date-time" }),
});

export type Video = typeof Video.static;

registerExamples(Video, bubble);

export const CompleteVideo = t.Intersect([
	Video,
	t.Union([
		t.Object({
			movie: Movie,
			episodes: t.Optional(t.Never()),
		}),
		t.Object({
			// TODO: implement that
			episodes: t.Array(t.Object({})),
			movie: t.Optional(t.Never()),
		}),
	]),
]);

export type CompleteVideo = typeof CompleteVideo.static;
