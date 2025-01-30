import { t } from "elysia";
import { comment } from "../../utils";
import { EpisodeId, Resource, SeedImage, TranslationRecord } from "../utils";
import { BaseEntry, EntryTranslation } from "./base-entry";

export const BaseSpecial = t.Intersect(
	[
		BaseEntry,
		t.Object({
			kind: t.Literal("special"),
			order: t.Number({
				minimum: 1,
				description: "Absolute playback order. Can be mixed with episodes.",
			}),
			number: t.Number({ minimum: 1 }),
			externalId: EpisodeId,
		}),
	],
	{
		description: comment`
			A special is either an OAV episode (side story & co) or an important episode that was released standalone
			(outside of a season.)
		`,
	},
);

export const Special = t.Intersect([Resource(), BaseSpecial, EntryTranslation]);
export type Special = typeof Special.static;

export const SeedSpecial = t.Intersect([
	t.Omit(BaseSpecial, ["thumbnail", "createdAt", "nextRefresh"]),
	t.Object({
		thumbnail: t.Nullable(SeedImage),
		translations: TranslationRecord(EntryTranslation),
		videos: t.Optional(t.Array(t.String({ format: "uuid" }))),
	}),
]);
export type SeedSpecial = typeof SeedSpecial.static;
