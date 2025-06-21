import { z } from "zod";
import { Genre } from "./utils/genre";
import { Image } from "./utils/images";
import { Metadata } from "./utils/metadata";
import { zdate } from "./utils/utils";

export const Collection = z
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
		rating: z.number().int().gte(0).lte(100).nullable(),
		startAir: zdate().nullable(),
		endAir: zdate().nullable(),
		genres: z.array(Genre),
		externalId: Metadata,

		poster: Image.nullable(),
		thumbnail: Image.nullable(),
		banner: Image.nullable(),
		logo: Image.nullable(),

		createdAt: zdate(),
		updatedAt: zdate(),
	})
	.transform((x) => ({
		...x,
		href: `/collections/${x.slug}`,
	}));

export type Collection = z.infer<typeof Collection>;
