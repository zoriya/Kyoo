import { t } from "elysia";
import { type Prettify, comment } from "~/utils";
import { ExtraType } from "./entry/extra";
import { bubbleVideo, registerExamples } from "./examples";
import { DbMetadata, EpisodeId, ExternalId, Resource } from "./utils";

export const Guess = t.Recursive((Self) =>
	t.Object(
		{
			title: t.String(),
			year: t.Optional(t.Array(t.Integer(), { default: [] })),
			season: t.Optional(t.Array(t.Integer(), { default: [] })),
			episode: t.Optional(t.Array(t.Integer(), { default: [] })),
			kind: t.Optional(t.UnionEnum(["episode", "movie", "extra"])),
			extraKind: t.Optional(ExtraType),

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
);
export type Guess = typeof Guess.static;

export const SeedVideo = t.Object({
	path: t.String(),
	rendering: t.String({
		description: comment`
			Sha of the path except \`part\` & \`version\`.
			If there are multiples files for the same entry, it can be used to know if each
			file is the same content or if it's unrelated (like long-version vs short-version, monochrome vs colored etc)
		`,
	}),
	part: t.Nullable(
		t.Integer({
			minimum: 0,
			description: comment`
				If the episode/movie is split into multiples files, the \`part\` field can be used to order them.
				The \`rendering\` field is used to know if two parts are in the same group or
				if it's another unrelated video file of the same entry.
			`,
		}),
	),
	version: t.Integer({
		minimum: 0,
		default: 1,
		description:
			"Kyoo will prefer playing back the highest `version` number if there are multiples rendering.",
	}),

	guess: Guess,

	for: t.Optional(
		t.Array(
			t.Union([
				t.Object({
					slug: t.String({
						format: "slug",
						examples: ["made-in-abyss-dawn-of-the-deep-soul"],
					}),
				}),
				t.Object({
					externalId: t.Optional(t.Union([EpisodeId, ExternalId()])),
				}),
				t.Object({
					movie: t.Union([
						t.String({ format: "uuid" }),
						t.String({ format: "slug", examples: ["bubble"] }),
					]),
				}),
				t.Intersect([
					t.Object({
						serie: t.Union([
							t.String({ format: "uuid" }),
							t.String({ format: "slug", examples: ["made-in-abyss"] }),
						]),
					}),
					t.Union([
						t.Object({
							season: t.Integer({ minimum: 1 }),
							episode: t.Integer(),
						}),
						t.Object({
							order: t.Number(),
						}),
						t.Object({
							special: t.Integer(),
						}),
					]),
				]),
			]),
			{ default: [] },
		),
	),
});
export type SeedVideo = Prettify<typeof SeedVideo.static>;

export const Video = t.Intersect([
	t.Object({
		id: t.String({ format: "uuid" }),
	}),
	t.Omit(SeedVideo, ["for"]),
	DbMetadata,
]);
export type Video = Prettify<typeof Video.static>;

// type used in entry responses (the slug comes from the entryVideoJoin)
export const EmbeddedVideo = t.Intersect([
	t.Object({ slug: t.String({ format: "slug" }) }),
	t.Omit(Video, ["guess", "createdAt", "updatedAt"]),
]);
export type EmbeddedVideo = Prettify<typeof EmbeddedVideo.static>;

registerExamples(Video, bubbleVideo);

export const Guesses = t.Object({
	paths: t.Array(t.String()),
	guesses: t.Record(
		t.String(),
		t.Record(
			t.Union([t.Literal("unknown"), t.String({ pattern: "[1-9][0-9]*" })]),
			Resource(),
		),
	),
	unmatched: t.Array(t.String()),
});
export type Guesses = typeof Guesses.static;

registerExamples(Guesses, {
	paths: [
		"/videos/Evangelion S01E02.mkv",
		"/videos/Evangelion (1995) S01E26.mkv",
		"/videos/SomeUnknownThing.mkv",
	],
	guesses: {
		Evangelion: {
			unknown: {
				id: "43b742f5-9ce6-467d-ad29-74460624020a",
				slug: "evangelion",
			},
			1995: {
				id: "43b742f5-9ce6-467d-ad29-74460624020a",
				slug: "evangelion",
			},
		},
	},
	unmatched: ["/videos/SomeUnknownThing.mkv"],
});
