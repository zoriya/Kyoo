import { t } from "elysia";
import { BaseEntry, EntryTranslation } from "./base-entry";
import { EpisodeId, SeedImage, TranslationRecord, Resource } from "../utils";

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
	BaseEpisode,
	t.Omit(BaseEntry, ["thumbnail", "createdAt", "nextRefresh"]),
	t.Object({
		thumbnail: t.Nullable(SeedImage),
		translations: TranslationRecord(EntryTranslation),
		videos: t.Optional(t.Array(t.String({ format: "uuid" }))),
	}),
]);
export type SeedEpisode = typeof SeedEpisode.static;
