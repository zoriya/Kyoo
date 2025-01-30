import { t } from "elysia";
import { comment } from "../../utils";
import {
	ExternalId,
	Image,
	Resource,
	SeedImage,
	TranslationRecord,
} from "../utils";
import { BaseEntry, EntryTranslation } from "./base-entry";

export const BaseMovieEntry = t.Intersect(
	[
		BaseEntry,
		t.Object({
			kind: t.Literal("movie"),
			order: t.Number({
				minimum: 1,
				description: "Absolute playback order. Can be mixed with episodes.",
			}),
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

export const MovieEntryTranslation = t.Intersect([
	EntryTranslation,
	t.Object({
		tagline: t.Nullable(t.String()),
		poster: t.Nullable(Image),
	}),
]);

export const MovieEntry = t.Intersect([
	Resource(),
	BaseMovieEntry,
	MovieEntryTranslation,
]);
export type MovieEntry = typeof MovieEntry.static;

export const SeedMovieEntry = t.Intersect([
	t.Omit(BaseMovieEntry, ["thumbnail", "createdAt", "nextRefresh"]),
	t.Object({
		slug: t.Optional(t.String({ format: "slug" })),
		thumbnail: t.Nullable(SeedImage),
		translations: TranslationRecord(
			t.Intersect([
				t.Omit(MovieEntryTranslation, ["poster"]),
				t.Object({ poster: t.Nullable(SeedImage) }),
			]),
		),
		videos: t.Optional(t.Array(t.String({ format: "uuid" }))),
	}),
]);
export type SeedMovieEntry = typeof SeedMovieEntry.static;
