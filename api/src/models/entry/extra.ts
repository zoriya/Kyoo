import { t } from "elysia";
import { BaseEntry, EntryTranslation } from "./base-entry";
import { EpisodeId } from "../utils/external-id";
import { comment } from "../../utils";
import { Resource } from "../utils/resource";

export const ExtraType = t.UnionEnum([
	"other",
	"trailers",
	"interview",
	"behind-the-scenes",
	"deleted-scenes",
	"bloopers",
]);
export type ExtraType = typeof ExtraType.static;

export const BaseExtra = t.Intersect(
	[
		BaseEntry,
		t.Object({
			kind: ExtraType,
			// not sure about this id type
			externalId: EpisodeId,
		}),
	],
	{
		description: comment`
			An extra can be a beyond-the-scene, short-episodes or anything that is in a different format & not required
			in the main story plot.
		`,
	},
);

export const Extra = t.Intersect([Resource, BaseExtra, EntryTranslation]);
export type Extra = typeof Extra.static;


