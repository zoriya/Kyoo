import { z } from "zod/v4";
import { KImage } from "./utils/images";
import { Metadata } from "./utils/metadata";
import { zdate } from "./utils/utils";

const Base = z.object({
	id: z.string(),
	slug: z.string(),
	order: z.number(),

	name: z.string().nullable(),
	description: z.string().nullable(),
	airDate: zdate().nullable(),
	runtime: z.number().nullable(),
	thumbnail: KImage.nullable(),

	createdAt: zdate(),
	updatedAt: zdate(),

	videos: z.array(
		z.object({
			id: z.string(),
			slug: z.string(),
			path: z.string(),
			rendering: z.string(),
			part: z.int().nullable(),
			version: z.int(),
		}),
	),
	progress: z.object({
		percent: z.int().min(0).max(100),
		time: z.int().min(0),
		playedDate: zdate().nullable(),
		videoId: z.string().nullable(),
	}),
});

export const Episode = Base.extend({
	kind: z.literal("episode"),
	seasonNumber: z.int().gte(0),
	episodeNumber: z.int().gte(0),
	externalId: z.record(
		z.string(),
		z.object({
			serieId: z.string(),
			season: z.int().nullable(),
			episode: z.int(),
			link: z.string().nullable(),
		}),
	),
});
export type Episode = z.infer<typeof Episode>;

export const MovieEntry = Base.extend({
	kind: z.literal("movie"),
	tagline: z.string().nullable(),
	poster: KImage.nullable(),
	externalId: Metadata,
});
export type MovieEntry = z.infer<typeof MovieEntry>;

export const Special = Base.extend({
	kind: z.literal("special"),
	number: z.int(),
	externalId: z.record(
		z.string(),
		z.object({
			serieId: z.string(),
			season: z.int().nullable(),
			episode: z.int(),
			link: z.string().nullable(),
		}),
	),
});
export type Special = z.infer<typeof Special>;

export const Entry = z
	.discriminatedUnion("kind", [Episode, MovieEntry, Special])
	.transform((x) => ({
		...x,
		// TODO: don't just pick the first video, be smart about it
		href: x.videos.length ? `/watch/${x.videos[0].slug}` : null,
	}));
export type Entry = z.infer<typeof Entry>;
