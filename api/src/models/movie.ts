import { t } from "elysia";
import {
	ExternalId,
	Genre,
	Image,
	Language,
	Resource,
} from "./utils";
import { Video } from "./video";

export const MovieStatus = t.UnionEnum(["unknown", "finished", "planned"]);
export type MovieStatus = typeof MovieStatus.static;

export const BaseMovie = t.Object({
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
export type BaseMovie = typeof BaseMovie.static;

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

export const Movie = t.Intersect([
	Resource,
	BaseMovie,
	t.Ref(MovieTranslation),
]);
export type Movie = typeof Movie.static;

export const SeedMovie = t.Intersect([
	BaseMovie,
	t.Object({
		slug: t.String({ format: "slug" }),
		image: t.Ref("image"),
		toto: t.Ref("mt"),
		translations: t.Record(t.String(), t.Ref("mt"), {
			minProperties: 1,
		}),
		videos: t.Optional(t.Array(t.Ref(Video))),
	}),
]);
export type SeedMovie = typeof SeedMovie.static;
