import { t } from "elysia";
import { type Prettify, comment } from "~/utils";
import { bubbleImages, registerExamples, youtubeExample } from "../examples";
import { DbMetadata, Resource } from "../utils";
import { EmbeddedVideo } from "../video";
import { BaseEntry, EntryTranslation } from "./base-entry";

export const BaseUnknownEntry = t.Intersect(
	[
		t.Object({
			kind: t.Literal("unknown"),
		}),
		t.Omit(BaseEntry(), ["airDate"]),
	],
	{
		description: comment`
			A video not releated to any series or movie. This can be due to a matching error but it can be a youtube
			video or any other video content.
		`,
	},
);

export const UnknownEntryTranslation = t.Omit(EntryTranslation(), [
	"description",
]);

export const UnknownEntry = t.Intersect([
	Resource(),
	UnknownEntryTranslation,
	BaseUnknownEntry,
	t.Object({
		video: t.Optional(EmbeddedVideo),
	}),
	DbMetadata,
]);
export type UnknownEntry = Prettify<typeof UnknownEntry.static>;

registerExamples(UnknownEntry, { ...youtubeExample, ...bubbleImages });
