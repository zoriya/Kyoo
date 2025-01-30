import { t } from "elysia";
import { comment } from "~/utils";
import { SeedImage } from "../utils";
import { Resource } from "../utils/resource";
import { BaseEntry } from "./base-entry";

export const ExtraType = t.UnionEnum([
	"other",
	"trailer",
	"interview",
	"behind-the-scene",
	"deleted-scene",
	"blooper",
]);
export type ExtraType = typeof ExtraType.static;

export const BaseExtra = t.Intersect(
	[
		t.Omit(BaseEntry, ["nextRefresh", "airDate"]),
		t.Object({
			kind: ExtraType,
			name: t.String(),
		}),
	],
	{
		description: comment`
			An extra can be a beyond-the-scene, short-episodes or anything that is in a different format & not required
			in the main story plot.
		`,
	},
);

export const Extra = t.Intersect([Resource(), BaseExtra]);
export type Extra = typeof Extra.static;

export const SeedExtra = t.Intersect([
	t.Omit(BaseExtra, ["thumbnail", "createdAt"]),
	t.Object({
		slug: t.String({ format: "slug" }),
		thumbnail: t.Nullable(SeedImage),
		video: t.String({ format: "uuid" }),
	}),
]);
export type SeedExtra = typeof SeedExtra.static;
