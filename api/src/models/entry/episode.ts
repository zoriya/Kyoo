import { t } from "elysia";
import type { Prettify } from "~/utils";
import { bubbleImages, madeInAbyss, registerExamples } from "../examples";
import { Progress } from "../history";
import {
	DbMetadata,
	EpisodeId,
	Resource,
	SeedImage,
	TranslationRecord,
} from "../utils";
import { EmbeddedVideo } from "../video";
import { BaseEntry, EntryTranslation } from "./base-entry";

export const BaseEpisode = t.Composite([
	t.Object({
		kind: t.Literal("episode"),
		order: t.Number({ description: "Absolute playback order." }),
		seasonNumber: t.Integer(),
		episodeNumber: t.Integer(),
		externalId: EpisodeId,
	}),
	BaseEntry(),
]);

export const Episode = t.Composite([
	Resource(),
	EntryTranslation(),
	BaseEpisode,
	t.Object({
		videos: t.Array(EmbeddedVideo),
		progress: Progress,
	}),
	DbMetadata,
]);
export type Episode = Prettify<typeof Episode.static>;

export const SeedEpisode = t.Composite([
	t.Omit(BaseEpisode, ["thumbnail", "nextRefresh"]),
	t.Object({
		thumbnail: t.Nullable(SeedImage),
		translations: TranslationRecord(EntryTranslation()),
		videos: t.Optional(t.Array(t.String({ format: "uuid" }), { default: [] })),
	}),
]);
export type SeedEpisode = Prettify<typeof SeedEpisode.static>;

const ep = madeInAbyss.entries.find((x) => x.kind === "episode")!;
registerExamples(Episode, {
	...ep,
	...ep.translations.en,
	...bubbleImages,
	slug: `${madeInAbyss.slug}-s${ep.seasonNumber}-e${ep.episodeNumber}`,
	videos: [],
});
