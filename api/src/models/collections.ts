import { t } from "elysia";
import type { Prettify } from "elysia/dist/types";
import { bubbleImages, duneCollection, registerExamples } from "./examples";
import {
	DbMetadata,
	ExternalId,
	Genre,
	Image,
	Language,
	Original,
	Resource,
	SeedImage,
	TranslationRecord,
} from "./utils";

const BaseCollection = t.Object({
	genres: t.Array(Genre),
	rating: t.Nullable(t.Integer({ minimum: 0, maximum: 100 })),
	startAir: t.Nullable(
		t.String({
			format: "date",
			descrpition: "Date of the first item of the collection",
		}),
	),
	endAir: t.Nullable(
		t.String({
			format: "date",
			descrpition: "Date of the last item of the collection",
		}),
	),
	nextRefresh: t.String({ format: "date-time" }),
	externalId: ExternalId(),
});

export const CollectionTranslation = t.Object({
	name: t.String(),
	description: t.Nullable(t.String()),
	tagline: t.Nullable(t.String()),
	aliases: t.Array(t.String()),
	tags: t.Array(t.String()),

	poster: t.Nullable(Image),
	thumbnail: t.Nullable(Image),
	banner: t.Nullable(Image),
	logo: t.Nullable(Image),
});

export const Collection = t.Composite([
	Resource(),
	CollectionTranslation,
	BaseCollection,
	DbMetadata,
	t.Object({
		original: Original,
	}),
]);
export type Collection = Prettify<typeof Collection.static>;

export const FullCollection = t.Intersect([
	Collection,
	t.Object({
		translations: t.Optional(TranslationRecord(CollectionTranslation)),
	}),
]);
export type FullCollection = Prettify<typeof FullCollection.static>;

export const SeedCollection = t.Composite([
	t.Omit(BaseCollection, ["startAir", "endAir", "nextRefresh"]),
	t.Object({
		slug: t.String({ format: "slug" }),
		originalLanguage: Language({
			description: "The language code this collection's items were made in.",
		}),
		translations: TranslationRecord(
			t.Composite([
				t.Omit(CollectionTranslation, [
					"poster",
					"thumbnail",
					"banner",
					"logo",
				]),
				t.Object({
					poster: t.Nullable(SeedImage),
					thumbnail: t.Nullable(SeedImage),
					banner: t.Nullable(SeedImage),
					logo: t.Nullable(SeedImage),
					latinName: t.Optional(Original.properties.latinName),
				}),
			]),
		),
	}),
]);
export type SeedCollection = Prettify<typeof SeedCollection.static>;

registerExamples(Collection, {
	...duneCollection,
	...duneCollection.translations.en,
	...bubbleImages,
});
