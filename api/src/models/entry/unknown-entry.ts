import { t } from "elysia";
import { comment } from "../../utils";
import { Resource } from "../utils/resource";
import { BaseEntry, EntryTranslation } from "./base-entry";

export const BaseUnknownEntry = t.Intersect(
	[
		t.Omit(BaseEntry, ["airDate"]),
		t.Object({
			kind: t.Literal("unknown"),
		}),
	],
	{
		description: comment`
			A video not releated to any series or movie. This can be due to a matching error but it can be a youtube
			video or any other video content.
		`,
	},
);

export const UnknownEntryTranslation = t.Omit(EntryTranslation, [
	"description",
]);

export const UnknownEntry = t.Intersect([
	Resource,
	BaseUnknownEntry,
	UnknownEntryTranslation,
]);
export type UnknownEntry = typeof UnknownEntry.static;
