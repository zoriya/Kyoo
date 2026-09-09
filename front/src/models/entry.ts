import { z } from "zod/v4";
import { Show } from "./show";
import { KImage } from "./utils/images";
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

	content: z.enum(["story", "recap", "filler", "ova"]),

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
	// When the first video of this entry was added, null if none is available.
	availableSince: zdate().nullable(),
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
		z.array(
			z.object({
				serieId: z.string(),
				season: z.int().nullable(),
				episode: z.int(),
				link: z.string().nullable(),
				label: z.string().optional().nullable(),
			}),
		),
	),
});
export type Episode = z.infer<typeof Episode>;

export const MovieEntry = Base.extend({
	kind: z.literal("movie"),
	tagline: z.string().nullable(),
	poster: KImage.nullable(),
	externalId: z.record(
		z.string(),
		z.array(
			z.union([
				z.object({
					serieId: z.string(),
					season: z.int().nullable(),
					episode: z.int(),
					link: z.string().nullable(),
					label: z.string().optional().nullable(),
				}),
				z.object({
					dataId: z.string(),
					link: z.string().nullable(),
					label: z.string().optional().nullable(),
				}),
			]),
		),
	),
});
export type MovieEntry = z.infer<typeof MovieEntry>;

export const Special = Base.extend({
	kind: z.literal("special"),
	number: z.int(),
	externalId: z.record(
		z.string(),
		z.array(
			z.object({
				serieId: z.string(),
				season: z.int().nullable(),
				episode: z.int(),
				link: z.string().nullable(),
			}),
		),
	),
});
export type Special = z.infer<typeof Special>;

export const BaseEntry = z
	.discriminatedUnion("kind", [Episode, MovieEntry, Special])
	.transform((x) => ({
		...x,
		href: x.videos.length ? `/watch/${x.videos[0].slug}` : null,
	}));

export const Entry = BaseEntry.and(
	z.object({
		get show() {
			return Show.optional();
		},
	}),
);
export type Entry = z.infer<typeof Entry>;
