import { t } from "elysia";
import { comment, type Prettify } from "~/utils";
import { bubbleImages, madeInAbyss, registerExamples } from "../examples";
import { Progress } from "../history";
import {
	DbMetadata,
	ExternalId,
	Image,
	Resource,
	SeedImage,
	TranslationRecord,
} from "../utils";
import { EmbeddedVideo } from "../video";
import { BaseEntry, EntryTranslation } from "./base-entry";

export const BaseMovieEntry = t.Composite(
	[
		t.Object({
			kind: t.Literal("movie"),
			order: t.Number({
				description: "Absolute playback order. Can be mixed with episodes.",
			}),
			externalId: ExternalId(),
		}),
		BaseEntry(),
	],
	{
		description: comment`
			If a movie is part of a serie (watching the movie require context from the serie &
			the next episode of the serie require you to have seen the movie to understand it.)
		`,
	},
);

export const MovieEntryTranslation = t.Composite([
	EntryTranslation(),
	t.Object({
		tagline: t.Nullable(t.String()),
		poster: t.Nullable(Image),
	}),
]);

export const MovieEntry = t.Composite([
	Resource(),
	MovieEntryTranslation,
	BaseMovieEntry,
	t.Object({
		videos: t.Array(EmbeddedVideo),
		progress: Progress,
	}),
	DbMetadata,
]);
export type MovieEntry = Prettify<typeof MovieEntry.static>;

export const SeedMovieEntry = t.Composite([
	t.Omit(BaseMovieEntry, ["thumbnail", "nextRefresh"]),
	t.Object({
		slug: t.Optional(t.Nullable(t.String({ format: "slug" }))),
		thumbnail: t.Nullable(SeedImage),
		translations: TranslationRecord(
			t.Intersect([
				t.Omit(MovieEntryTranslation, ["poster"]),
				t.Object({ poster: t.Nullable(SeedImage) }),
			]),
		),
		videos: t.Optional(t.Array(t.String({ format: "uuid" }), { default: [] })),
	}),
]);
export type SeedMovieEntry = Prettify<typeof SeedMovieEntry.static>;

const ep = madeInAbyss.entries.find((x) => x.kind === "movie")!;
registerExamples(MovieEntry, {
	...ep,
	...ep.translations.en,
	...bubbleImages,
});
