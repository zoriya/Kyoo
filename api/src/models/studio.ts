import { t } from "elysia";
import type { Prettify } from "elysia/dist/types";
import { madeInAbyss, registerExamples } from "./examples";
import { ExternalId, Resource, TranslationRecord } from "./utils";
import { Image, SeedImage } from "./utils/image";

const BaseStudio = t.Object({
	createdAt: t.String({ format: "date-time" }),

	externalId: ExternalId,
});

export const StudioTranslation = t.Object({
	name: t.String(),
	logo: t.Nullable(Image),
});

export const Studio = t.Intersect([Resource(), StudioTranslation, BaseStudio]);
export type Studio = Prettify<typeof Studio.static>;

export const SeedStudio = t.Intersect([
	t.Omit(BaseStudio, ["createdAt"]),
	t.Object({
		slug: t.String({ format: "slug" }),
		translations: TranslationRecord(
			t.Object({
				name: t.String(),
				logo: t.Nullable(SeedImage),
			}),
		),
	}),
]);
export type SeedStudio = Prettify<typeof SeedStudio.static>;

registerExamples(Studio, madeInAbyss.studios[0]);
