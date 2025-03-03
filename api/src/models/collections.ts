import { t } from "elysia";
import type { Prettify } from "elysia/dist/types";
import { bubbleImages, duneCollection, registerExamples } from "./examples";
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

const BaseCollection = t.Object({
	kind: t.Literal("collection"),
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
	originalLanguage: t.Nullable(
		Language({
			description: "The language code this movie was made in.",
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

export const Collection = t.Intersect([
	Resource(),
	CollectionTranslation,
	BaseCollection,
	DbMetadata,
]);
export type Collection = Prettify<typeof Collection.static>;

export const FullCollection = t.Intersect([
	Collection,
	t.Object({
		translations: t.Optional(TranslationRecord(CollectionTranslation)),
	}),
]);
export type FullCollection = Prettify<typeof FullCollection.static>;

export const SeedCollection = t.Intersect([
	t.Omit(BaseCollection, ["kind", "startAir", "endAir", "nextRefresh"]),
	t.Object({
		slug: t.String({ format: "slug" }),
		translations: TranslationRecord(
			t.Intersect([
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
