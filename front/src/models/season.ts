import { z } from "zod/v4";
import { KImage } from "./utils/images";
import { zdate } from "./utils/utils";

export const Season = z.object({
	id: z.string(),
	slug: z.string(),
	seasonNumber: z.int().gte(0),
	name: z.string().nullable(),
	description: z.string().nullable(),
	entriesCount: z.int().gte(0),
	availableCount: z.int().gte(0),
	startAir: zdate().nullable(),
	endAir: zdate().nullable(),
	externalId: z.record(
		z.string(),
		z.object({
			serieId: z.string(),
			season: z.number(),
			link: z.string().nullable(),
		}),
	),

	poster: KImage.nullable(),
	thumbnail: KImage.nullable(),
	banner: KImage.nullable(),

	createdAt: zdate(),
	updatedAt: zdate(),
});

export type Season = z.infer<typeof Season>;
