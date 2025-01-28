import { type TSchema, t } from "elysia";
import { comment } from "../utils";
import { bubbleVideo, registerExamples } from "./examples";

export const Video = t.Object({
	id: t.String({ format: "uuid" }),
	slug: t.String({ format: "slug" }),
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

	guess: t.Optional(
		t.Recursive((Self) =>
			t.Object(
				{
					title: t.String(),
					year: t.Optional(t.Array(t.Integer(), { default: [] })),
					season: t.Optional(t.Array(t.Integer(), { default: [] })),
					episode: t.Optional(t.Array(t.Integer(), { default: [] })),
					// TODO: maybe replace "extra" with the `extraKind` value (aka behind-the-scene, trailer, etc)
					type: t.Optional(t.UnionEnum(["episode", "movie", "extra"])),

					from: t.String({
						description: "Name of the tool that made the guess",
					}),
					history: t.Optional(
						t.Array(t.Omit(Self, ["history"]), {
							default: [],
							description: comment`
								When another tool refines the guess or a user manually edit it, the history of the guesses
								are kept in this \`history\` value.
							`,
						}),
					),
				},
				{
					additionalProperties: true,
					description: comment`
						Metadata guessed from the filename. Kyoo can use those informations to bypass
						the scanner/metadata fetching and just register videos to movies/entries that already
						exists. If Kyoo can't find a matching movie/entry, this information will be sent to
						the scanner.
					`,
				},
			),
		),
	),
});
export type Video = typeof Video.static;
registerExamples(Video, bubbleVideo);

export const SeedVideo = t.Omit(Video, ["id", "slug", "createdAt"]);
export type SeedVideo = typeof SeedVideo.static;
