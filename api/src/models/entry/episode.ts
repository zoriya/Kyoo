import { t } from "elysia";
import { BaseEntry, EntryTranslation } from "./base-entry";
import { EpisodeId } from "../utils/external-id";
import { Resource } from "../utils/resource";

export const BaseEpisode = t.Intersect([
	BaseEntry,
	t.Object({
		kind: t.Literal("episode"),
		order: t.Number({ minimum: 1, description: "Absolute playback order." }),
		seasonNumber: t.Number(),
		episodeNumber: t.Number(),
		externalId: EpisodeId,
	}),
]);

export const Episode = t.Intersect([Resource, BaseEpisode, EntryTranslation]);
export type Episode = typeof Episode.static;
