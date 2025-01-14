import { t } from "elysia";
import { ExternalId, Genre, Image, Language, SeedImage, TranslationRecord } from "./utils";
import { bubble, registerExamples } from "./examples";
import { bubbleImages } from "./examples/bubble";

export const MovieStatus = t.UnionEnum(["unknown", "finished", "planned"]);
export type MovieStatus = typeof MovieStatus.static;

const BaseMovie = t.Object({
	id: t.String({ format: "uuid" }),
	slug: t.String({ format: "slug" }),
	genres: t.Array(Genre),
	rating: t.Nullable(t.Number({ minimum: 0, maximum: 100 })),
	status: MovieStatus,
	runtime: t.Nullable(
		t.Number({ minimum: 0, description: "Runtime of the movie in minutes." }),
	),

	airDate: t.Nullable(t.String({ format: "date" })),
	originalLanguage: t.Nullable(
		Language({
			description: "The language code this movie was made in.",
		}),
	),

	createdAt: t.String({ format: "date-time" }),
	nextRefresh: t.String({ format: "date-time" }),

	externalId: ExternalId,
});

export const MovieTranslation = t.Object({
	name: t.String(),
	description: t.Nullable(t.String()),
	tagline: t.Nullable(t.String()),
	aliases: t.Array(t.String()),
	tags: t.Array(t.String()),

	poster: t.Nullable(Image),
	thumbnail: t.Nullable(Image),
	banner: t.Nullable(Image),
	logo: t.Nullable(Image),
	trailerUrl: t.Nullable(t.String()),
});
export type MovieTranslation = typeof MovieTranslation.static;

export const Movie = t.Intersect([BaseMovie, MovieTranslation]);
export type Movie = typeof Movie.static;

export const SeedMovie = t.Intersect([
	t.Omit(BaseMovie, ["id", "createdAt", "nextRefresh"]),
	t.Object({
		translations: TranslationRecord(
			t.Intersect([
				t.Omit(MovieTranslation, ["poster", "thumbnail", "banner", "logo"]),
				t.Object({
					poster: t.Nullable(SeedImage),
					thumbnail: t.Nullable(SeedImage),
					banner: t.Nullable(SeedImage),
					logo: t.Nullable(SeedImage),
				}),
			]),
		),
		videos: t.Optional(t.Array(t.String({ format: "uuid" }))),
	}),
]);
export type SeedMovie = typeof SeedMovie.static;

registerExamples(Movie, {
	...bubble,
	...bubble.translations.en,
	...bubbleImages,
});
registerExamples(SeedMovie, bubble);
