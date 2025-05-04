import { t } from "elysia";
import type { Prettify } from "elysia/dist/types";
import { bubbleImages, madeInAbyss, registerExamples } from "./examples";
import { DbMetadata, ExternalId, Resource, TranslationRecord } from "./utils";
import { Image, SeedImage } from "./utils/image";

const BaseStudio = t.Object({
	externalId: ExternalId(),
});

export const StudioTranslation = t.Object({
	name: t.String(),
	logo: t.Nullable(Image),
});
export type StudioTranslation = typeof StudioTranslation.static;

export const Studio = t.Composite([
	Resource(),
	StudioTranslation,
	BaseStudio,
	DbMetadata,
]);
export type Studio = Prettify<typeof Studio.static>;

export const SeedStudio = t.Composite([
	BaseStudio,
	t.Object({
		slug: t.String({ format: "slug" }),
		translations: TranslationRecord(
			t.Composite([
				t.Omit(StudioTranslation, ["logo"]),
				t.Object({
					logo: t.Nullable(SeedImage),
				}),
			]),
		),
	}),
]);
export type SeedStudio = Prettify<typeof SeedStudio.static>;

const ex = madeInAbyss.studios[0];
registerExamples(Studio, { ...ex, ...ex.translations.en, ...bubbleImages });
