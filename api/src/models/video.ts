import { t } from "elysia";
import { comment } from "../utils";
import { bubble, registerExamples } from "./examples";
import { Movie } from "./movie";

export const Video = t.Object({
	id: t.String({ format: "uuid" }),
	slug: t.String(),
	path: t.String(),
	rendering: t.String({
		description: comment`
			Sha of the path except \`part\` & \`version\`.
			If there are multiples files for the same entry, it can be used to know if each
			file is the same content or if it's unrelated (like long-version vs short-version, monochrome vs colored etc)
		`,
	}),
	part: t.Nullable(
		t.Number({
			minimum: 0,
			description: comment`
				If the episode/movie is split into multiples files, the \`part\` field can be used to order them.
				The \`rendering\` field is used to know if two parts are in the same group or
				if it's another unrelated video file of the same entry.
			`,
		}),
	),
	version: t.Number({
		minimum: 0,
		default: 1,
		description:
			"Kyoo will prefer playing back the highest `version` number if there are multiples rendering.",
	}),

	createdAt: t.String({ format: "date-time" }),
});

export type Video = typeof Video.static;

registerExamples(Video, ...bubble.videos);
