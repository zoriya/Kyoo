import { t } from "elysia";
import { comment } from "../../utils";
import { EpisodeId } from "../utils/external-id";
import { Resource } from "../utils/resource";
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

export const Special = t.Intersect([Resource, BaseSpecial, EntryTranslation]);
export type Special = typeof Special.static;
