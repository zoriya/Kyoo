import { t } from "elysia";
import { comment } from "../../utils";
import { ExternalId } from "../utils/external-id";
import { Image } from "../utils/image";
import { Resource } from "../utils/resource";
import { BaseEntry, EntryTranslation } from "./base-entry";

export const BaseMovieEntry = t.Intersect(
	[
		t.Omit(BaseEntry, ["thumbnail"]),
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
		thumbnail: t.Nullable(Image),
	}),
]);

export const MovieEntry = t.Intersect([
	Resource,
	BaseMovieEntry,
	MovieEntryTranslation,
]);
export type MovieEntry = typeof MovieEntry.static;
