import { PatternStringExact, type TSchema } from "@sinclair/typebox";
import { t } from "elysia";
import { comment, type Prettify } from "~/utils";
import { ExtraType } from "./entry/extra";
import { bubble, bubbleVideo, registerExamples } from "./examples";
import { DbMetadata, EpisodeId, ExternalId, Resource } from "./utils";

const Opt = (schema: TSchema) => t.Optional(t.Nullable(schema));

export const Guess = t.Recursive((Self) =>
	t.Object(
		{
			title: t.String(),
			kind: Opt(t.UnionEnum(["episode", "movie", "extra"])),
			extraKind: Opt(ExtraType),
			years: Opt(t.Array(t.Integer(), { default: [] })),
			episodes: Opt(
				t.Array(
					t.Object({ season: t.Nullable(t.Integer()), episode: t.Integer() }),
					{ default: [] },
				),
			),
			externalId: Opt(t.Record(t.String(), t.String())),

			from: t.String({
				description: "Name of the tool that made the guess",
			}),
			history: t.Array(t.Omit(Self, ["history"]), {
				default: [],
				description: comment`
					When another tool refines the guess or a user manually edit it, the history of the guesses
					are kept in this \`history\` value.
				`,
			}),
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
					externalId: t.Record(
						t.String(),
						t.Omit(
							t.Union([
								EpisodeId.patternProperties[PatternStringExact],
								ExternalId().patternProperties[PatternStringExact],
							]),
							["link"],
						),
					),
				}),
				t.Object({
					movie: t.Union([
						t.String({ format: "uuid" }),
						t.String({ format: "slug", examples: ["bubble"] }),
					]),
				}),
				t.Object({
					serie: t.Union([
						t.String({ format: "uuid" }),
						t.String({ format: "slug", examples: ["made-in-abyss"] }),
					]),
					season: t.Integer({ minimum: 1 }),
					episode: t.Integer(),
				}),
				t.Object({
					serie: t.Union([
						t.String({ format: "uuid" }),
						t.String({ format: "slug", examples: ["made-in-abyss"] }),
					]),
					order: t.Number(),
				}),
				t.Object({
					serie: t.Union([
						t.String({ format: "uuid" }),
						t.String({ format: "slug", examples: ["made-in-abyss"] }),
					]),
					special: t.Integer(),
				}),
			]),
			{ default: [] },
		),
	),
});
export type SeedVideo = Prettify<typeof SeedVideo.static>;

export const Video = t.Composite([
	t.Object({
		id: t.String({ format: "uuid" }),
	}),
	t.Omit(SeedVideo, ["for"]),
	DbMetadata,
]);
export type Video = Prettify<typeof Video.static>;

// type used in entry responses (the slug comes from the entryVideoJoin)
export const EmbeddedVideo = t.Composite(
	[
		t.Object({ slug: t.String({ format: "slug" }) }),
		t.Omit(Video, ["guess", "createdAt", "updatedAt"]),
	],
	{ additionalProperties: true },
);
export type EmbeddedVideo = Prettify<typeof EmbeddedVideo.static>;

registerExamples(Video, bubbleVideo);
registerExamples(SeedVideo, {
	...bubbleVideo,
	for: [
		{ movie: "bubble" },
		{
			externalId: {
				themoviedatabase: {
					dataId: bubble.externalId.themoviedatabase.dataId,
				},
			},
		},
	],
});

export const Guesses = t.Object({
	paths: t.Array(t.String()),
	guesses: t.Record(
		t.String(),
		t.Record(t.String({ pattern: "^([1-9][0-9]{3})|unknown$" }), Resource()),
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
			"1995": {
				id: "43b742f5-9ce6-467d-ad29-74460624020a",
				slug: "evangelion",
			},
		},
	},
	unmatched: ["/videos/SomeUnknownThing.mkv"],
});
