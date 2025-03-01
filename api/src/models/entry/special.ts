import { t } from "elysia";
import { type Prettify, comment } from "~/utils";
import { bubbleImages, madeInAbyss, registerExamples } from "../examples";
import { EpisodeId, Resource, SeedImage, TranslationRecord } from "../utils";
import { BaseEntry, EntryTranslation } from "./base-entry";

export const BaseSpecial = t.Intersect(
	[
		t.Object({
			kind: t.Literal("special"),
			order: t.Number({
				minimum: 1,
				description: "Absolute playback order. Can be mixed with episodes.",
			}),
			number: t.Integer({ minimum: 1 }),
			externalId: EpisodeId,
		}),
		BaseEntry(),
	],
	{
		description: comment`
			A special is either an OAV episode (side story & co) or an important episode that was released standalone
			(outside of a season.)
		`,
	},
);

export const Special = t.Intersect([
	Resource(),
	EntryTranslation(),
	BaseSpecial,
]);
export type Special = Prettify<typeof Special.static>;

export const SeedSpecial = t.Intersect([
	t.Omit(BaseSpecial, ["thumbnail", "createdAt", "nextRefresh"]),
	t.Object({
		thumbnail: t.Nullable(SeedImage),
		translations: TranslationRecord(EntryTranslation()),
		videos: t.Optional(t.Array(t.String({ format: "uuid" }))),
	}),
]);
export type SeedSpecial = Prettify<typeof SeedSpecial.static>;

const ep = madeInAbyss.entries.find((x) => x.kind === "special")!;
registerExamples(Special, {
	...ep,
	...ep.translations.en,
	...bubbleImages,
	slug: `${madeInAbyss.slug}-sp3`,
});
