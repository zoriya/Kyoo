import { t } from "elysia";
import type { Prettify } from "~/utils";
import { bubbleImages, madeInAbyss, registerExamples } from "./examples";
import { DbMetadata } from "./utils";
import { SeasonId } from "./utils/external-id";
import { Image, SeedImage } from "./utils/image";
import { TranslationRecord } from "./utils/language";
import { Resource } from "./utils/resource";

export const BaseSeason = t.Object({
	seasonNumber: t.Integer({ minimum: 0 }),
	startAir: t.Nullable(t.String({ format: "date" })),
	endAir: t.Nullable(t.String({ format: "date" })),

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

export const Season = t.Composite([
	Resource(),
	SeasonTranslation,
	BaseSeason,
	DbMetadata,
	t.Object({
		entriesCount: t.Integer({
			description: "The number of episodes in this season",
		}),

		availableCount: t.Integer({
			description: "The number of episodes that can be played right away",
		}),
	}),
]);
export type Season = Prettify<typeof Season.static>;

export const SeedSeason = t.Composite([
	t.Omit(BaseSeason, ["nextRefresh"]),
	t.Object({
		translations: TranslationRecord(
			t.Composite([
				t.Omit(SeasonTranslation, ["poster", "thumbnail", "banner"]),
				t.Object({
					poster: t.Nullable(SeedImage),
					thumbnail: t.Nullable(SeedImage),
					banner: t.Nullable(SeedImage),
				}),
			]),
		),
	}),
]);
export type SeedSeason = Prettify<typeof SeedSeason.static>;

registerExamples(Season, {
	...madeInAbyss.seasons[0],
	...madeInAbyss.seasons[0].translations.en,
	...bubbleImages,
	slug: `${madeInAbyss.slug}-s1`,
});
