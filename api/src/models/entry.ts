import { t } from "elysia";
import { Image } from "./utils/image";
import { ExternalId, EpisodeId } from "./utils/external-id";
import { comment } from "../utils";
import { madeInAbyss, registerExamples } from "./examples";

const BaseEntry = t.Object({
	id: t.String({ format: "uuid" }),
	slug: t.String(),
	name: t.Nullable(t.String()),
	description: t.Nullable(t.String()),
	airDate: t.Nullable(t.String({ format: "data" })),
	runtime: t.Nullable(
		t.Number({ minimum: 0, description: "Runtime of the episode in minutes" }),
	),
	thumbnail: t.Nullable(Image),

	createdAt: t.String({ format: "date-time" }),
	nextRefresh: t.String({ format: "date-time" }),
});

export const Episode = t.Intersect([
	BaseEntry,
	t.Object({
		kind: t.Literal("episode"),
		order: t.Number({ minimum: 1, description: "Absolute playback order." }),
		seasonNumber: t.Number(),
		episodeNumber: t.Number(),
		externalId: EpisodeId,
	}),
]);
export type Episode = typeof Episode.static;

export const MovieEntry = t.Intersect(
	[
		t.Omit(BaseEntry, ["thumbnail"]),
		t.Object({
			kind: t.Literal("movie"),
			order: t.Number({
				minimum: 1,
				description: "Absolute playback order. Can be mixed with episodes.",
			}),
			tagline: t.String(),
			poster: BaseEntry.properties.thumbnail,
			externalId: ExternalId,
		}),
	],
	{
		description: comment`
			If a movie is part of a serie (watching the movie require context from the serie &
			the next episode of the serie require you to have seen the movie to understand it.)
		`,
	},
);
export type MovieEntry = typeof MovieEntry.static;

export const Special = t.Intersect(
	[
		BaseEntry,
		t.Object({
			kind: t.Literal("special"),
			order: t.Number({
				minimum: 1,
				description: "Absolute playback order. Can be mixed with episodes.",
			}),
			number: t.Number({ minimum: 1 }),
			externalId: EpisodeId,
		}),
	],
	{
		description: comment`
			A special is either an OAV episode (side story & co) or an important episode that was released standalone
			(outside of a season.)
		`,
	},
);
export type Special = typeof Special.static;

export const ExtraType = t.UnionEnum([
	"other",
	"trailers",
	"interview",
	"behind-the-scenes",
	"deleted-scenes",
	"bloopers",
]);
export type ExtraType = typeof ExtraType.static;

export const Extra = t.Intersect(
	[
		BaseEntry,
		t.Object({
			kind: ExtraType,
			// not sure about this id type
			externalId: EpisodeId,
		}),
	],
	{
		description: comment`
			An extra can be a beyond-the-scene, short-episodes or anything that is in a different format & not required
			in the main story plot.
		`,
	},
);
export type Extra = typeof Extra.static;

export const UnknownEntry = t.Intersect(
	[
		t.Omit(BaseEntry, ["airDate", "description"]),
		t.Object({
			kind: t.Literal("unknown"),
		}),
	],
	{
		description: comment`
			A video not releated to any series or movie. This can be due to a matching error but it can be a youtube
			video or any other video content.
		`,
	},
);
export type UnknownEntry = typeof UnknownEntry.static;

export const Entry = t.Union([Episode, MovieEntry, Special]);
export type Entry = typeof Entry.static;

registerExamples(
	Episode,
	...madeInAbyss.entries.filter((x) => x.kind === "episode"),
);
registerExamples(
	MovieEntry,
	...madeInAbyss.entries.filter((x) => x.kind === "movie"),
);
registerExamples(
	Special,
	...madeInAbyss.entries.filter((x) => x.kind === "special"),
);
registerExamples(Extra, ...madeInAbyss.extras);
