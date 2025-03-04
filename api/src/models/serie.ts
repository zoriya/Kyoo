import { t } from "elysia";
import type { Prettify } from "~/utils";
import { SeedCollection } from "./collections";
import { SeedEntry, SeedExtra } from "./entry";
import { bubbleImages, madeInAbyss, registerExamples } from "./examples";
import { SeedSeason } from "./season";
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

export const SerieStatus = t.UnionEnum([
	"unknown",
	"finished",
	"airing",
	"planned",
]);
export type SerieStatus = typeof SerieStatus.static;

const BaseSerie = t.Object({
	kind: t.Literal("serie"),
	genres: t.Array(Genre),
	rating: t.Nullable(t.Integer({ minimum: 0, maximum: 100 })),
	status: SerieStatus,
	runtime: t.Nullable(
		t.Number({
			minimum: 0,
			description: "Average runtime of all episodes (in minutes.)",
		}),
	),

	startAir: t.Nullable(t.String({ format: "date" })),
	endAir: t.Nullable(t.String({ format: "date" })),
	originalLanguage: t.Nullable(
		Language({
			description: "The language code this serie was made in.",
		}),
	),

	nextRefresh: t.String({ format: "date-time" }),

	externalId: ExternalId(),
});

export const SerieTranslation = t.Object({
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
export type SerieTranslation = typeof SerieTranslation.static;

export const Serie = t.Intersect([
	Resource(),
	SerieTranslation,
	BaseSerie,
	DbMetadata,
]);
export type Serie = Prettify<typeof Serie.static>;

export const FullSerie = t.Intersect([
	Serie,
	t.Object({
		translations: t.Optional(TranslationRecord(SerieTranslation)),
		studios: t.Optional(t.Array(Studio)),
	}),
]);
export type FullMovie = Prettify<typeof FullSerie.static>;

export const SeedSerie = t.Intersect([
	t.Omit(BaseSerie, ["kind", "nextRefresh"]),
	t.Object({
		slug: t.String({ format: "slug" }),
		translations: TranslationRecord(
			t.Intersect([
				t.Omit(SerieTranslation, ["poster", "thumbnail", "banner", "logo"]),
				t.Object({
					poster: t.Nullable(SeedImage),
					thumbnail: t.Nullable(SeedImage),
					banner: t.Nullable(SeedImage),
					logo: t.Nullable(SeedImage),
				}),
			]),
		),
		seasons: t.Array(SeedSeason),
		entries: t.Array(SeedEntry),
		extras: t.Optional(t.Array(SeedExtra)),
		collection: t.Optional(SeedCollection),
		studios: t.Array(SeedStudio),
	}),
]);
export type SeedSerie = typeof SeedSerie.static;

registerExamples(Serie, {
	...madeInAbyss,
	...madeInAbyss.translations.en,
	...bubbleImages,
});
