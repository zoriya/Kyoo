import { t } from "elysia";
import { Genre } from "./utils/genres";
import { Image } from "./utils/image";
import { ExternalId } from "./utils/external-id";
import { madeInAbyss, registerExamples } from "./examples";
import { Resource } from "./utils/resource";
import { Language } from "./utils/language";
import { SeedSeason } from "./season";

export const SerieStatus = t.UnionEnum([
	"unknown",
	"finished",
	"airing",
	"planned",
]);
export type SerieStatus = typeof SerieStatus.static;

export const BaseSerie = t.Object({
	genres: t.Array(Genre),
	rating: t.Nullable(t.Number({ minimum: 0, maximum: 100 })),
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

	createdAt: t.String({ format: "date-time" }),
	nextRefresh: t.String({ format: "date-time" }),

	externalId: ExternalId,
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

export const Serie = t.Intersect([Resource, BaseSerie, SerieTranslation]);
export type Serie = typeof Serie.static;

export const SeedSerie = t.Intersect([
	BaseSerie,
	t.Object({
		translations: t.Record(Language(), SerieTranslation, { minProperties: 1 }),
		seasons: t.Array(SeedSeason),
		// entries: t.Array(SeedEntry),
		// extras: t.Optional(t.Array(SeedExtra)),
	}),
]);
export type SeedSerie = typeof SeedSerie.static;
