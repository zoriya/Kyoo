import { t } from "elysia";
import type { Prettify } from "~/utils";
import { SeedCollection } from "./collections";
import { bubble, bubbleImages, registerExamples } from "./examples";
import { SeedStaff } from "./staff";
import { SeedStudio, Studio } from "./studio";
import {
	DbMetadata,
	ExternalId,
	Genre,
	Image,
	Language,
	Resource,
	SeedImage,
	TranslationRecord,
} from "./utils";
import { Original } from "./utils/original";
import { EmbeddedVideo } from "./video";
import { MovieWatchStatus } from "./watchlist";

export const MovieStatus = t.UnionEnum(["unknown", "finished", "planned"]);
export type MovieStatus = typeof MovieStatus.static;

const BaseMovie = t.Object({
	genres: t.Array(Genre),
	rating: t.Nullable(t.Integer({ minimum: 0, maximum: 100 })),
	status: MovieStatus,
	runtime: t.Nullable(
		t.Number({ minimum: 0, description: "Runtime of the movie in minutes." }),
	),
	airDate: t.Nullable(t.String({ format: "date" })),
	nextRefresh: t.String({ format: "date-time" }),
	externalId: ExternalId(),
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

export const Movie = t.Composite([
	Resource(),
	MovieTranslation,
	BaseMovie,
	DbMetadata,
	t.Object({
		original: Original,
		isAvailable: t.Boolean(),
		watchStatus: t.Nullable(MovieWatchStatus),
	}),
]);
export type Movie = Prettify<typeof Movie.static>;

export const FullMovie = t.Intersect([
	Movie,
	t.Object({
		translations: t.Optional(TranslationRecord(MovieTranslation)),
		videos: t.Optional(t.Array(EmbeddedVideo)),
		studios: t.Optional(t.Array(Studio)),
	}),
]);
export type FullMovie = Prettify<typeof FullMovie.static>;

export const SeedMovie = t.Composite([
	t.Omit(BaseMovie, ["nextRefresh"]),
	t.Object({
		slug: t.String({ format: "slug", examples: ["bubble"] }),
		originalLanguage: Language({
			description: "The language code this movie was made in.",
		}),
		translations: TranslationRecord(
			t.Composite([
				t.Omit(MovieTranslation, [
					"poster",
					"thumbnail",
					"banner",
					"logo",
					"trailerUrl",
				]),
				t.Object({
					poster: t.Nullable(SeedImage),
					thumbnail: t.Nullable(SeedImage),
					banner: t.Nullable(SeedImage),
					logo: t.Nullable(SeedImage),
					trailer: t.Nullable(SeedImage),
					latinName: t.Optional(Original.properties.latinName),
				}),
			]),
		),
		videos: t.Optional(t.Array(t.String({ format: "uuid" }), { default: [] })),
		collection: t.Optional(SeedCollection),
		studios: t.Optional(t.Array(SeedStudio, { default: [] })),
		staff: t.Optional(t.Array(SeedStaff, { default: [] })),
	}),
]);
export type SeedMovie = Prettify<typeof SeedMovie.static>;

registerExamples(Movie, {
	...bubble,
	...bubble.translations.en,
	...bubbleImages,
});
