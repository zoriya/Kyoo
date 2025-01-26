import { t } from "elysia";
import { EpisodeId, Resource, SeedImage, TranslationRecord } from "../utils";
import { BaseEntry, EntryTranslation } from "./base-entry";

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

export const Episode = t.Intersect([Resource(), BaseEpisode, EntryTranslation]);
export type Episode = typeof Episode.static;

export const SeedEpisode = t.Intersect([
	t.Omit(BaseEpisode, ["thumbnail", "createdAt", "nextRefresh"]),
	t.Object({
		thumbnail: t.Nullable(SeedImage),
		translations: TranslationRecord(EntryTranslation),
		videos: t.Optional(t.Array(t.String({ format: "uuid" }))),
	}),
]);
export type SeedEpisode = typeof SeedEpisode.static;
