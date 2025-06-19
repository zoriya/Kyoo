import { z } from "zod";
import { Entry } from "./entry";
import { Studio } from "./studio";
import { Genre } from "./utils/genre";
import { Image } from "./utils/images";
import { Metadata } from "./utils/metadata";
import { zdate } from "./utils/utils";

export const Serie = z
	.object({
		id: z.string(),
		slug: z.string(),
		name: z.string(),
		original: z.object({
			name: z.string(),
			latinName: z.string().nullable(),
			language: z.string(),
		}),
		tagline: z.string().nullable(),
		aliases: z.array(z.string()),
		tags: z.array(z.string()),
		description: z.string().nullable(),
		status: z.enum(["unknown", "finished", "airing", "planned"]),
		rating: z.number().int().gte(0).lte(100).nullable(),
		startAir: zdate().nullable(),
		endAir: zdate().nullable(),
		genres: z.array(Genre),
		runtime: z.number().nullable(),
		externalId: Metadata,

		entriesCount: z.number().int(),
		availableCount: z.number().int(),

		poster: Image.nullable(),
		thumbnail: Image.nullable(),
		banner: Image.nullable(),
		logo: Image.nullable(),
		trailerUrl: z.string().optional().nullable(),

		createdAt: zdate(),
		updatedAt: zdate(),

		studios: z.array(Studio).optional(),
		firstEntry: Entry.optional().nullable(),
		nextEntry: Entry.optional().nullable(),
		watchStatus: z
			.object({
				status: z.enum(["completed", "watching", "rewatching", "dropped", "planned"]),
				score: z.number().int().gte(0).lte(100).nullable(),
				startedAt: zdate().nullable(),
				completedAt: zdate().nullable(),
				seenCount: z.number().int().gte(0),
			})
			.nullable(),
	})
	.transform((x) => ({
		...x,
		href: `/serie/${x.slug}`,
		playHref: x.firstEntry ? `/watch/${x.firstEntry.slug}` : null,
	}));

export type Serie = z.infer<typeof Serie>;
