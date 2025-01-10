import { t } from "elysia";
import { Image } from "./utils/image";
import { SeasonId } from "./utils/external-id";
import { Resource } from "./utils/resource";
import { Language } from "./utils/language";

export const BaseSeason = t.Object({
	seasonNumber: t.Number({ minimum: 1 }),
	startAir: t.Nullable(t.String({ format: "date" })),
	endAir: t.Nullable(t.String({ format: "date" })),

	createdAt: t.String({ format: "date-time" }),
	nextRefresh: t.String({ format: "date-time" }),

	externalId: SeasonId,
});

export const SeasonTranslation = t.Object({
	name: t.Nullable(t.String()),
	description: t.Nullable(t.String()),

	poster: t.Nullable(Image),
	thumbnail: t.Nullable(Image),
	banner: t.Nullable(Image),
});
export type SeasonTranslation = typeof SeasonTranslation.static;

export const Season = t.Intersect([Resource, BaseSeason, SeasonTranslation]);
export type Season = typeof Season.static;

export const SeedSeason = t.Intersect([
	BaseSeason,
	t.Object({
		translations: t.Record(Language(), SeasonTranslation, { minPropreties: 1 }),
	}),
]);
