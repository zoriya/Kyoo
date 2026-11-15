import { EntityMixin } from "@data-client/rest";
import { z } from "zod/v4";
import { KImage } from "./utils/images";
import { typed, zdate } from "./utils/utils";

const season = z.object({
	kind: z.literal("season").default("season"),
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
		z.array(
			z.object({
				serieId: z.string(),
				season: z.number(),
				link: z.string().nullable(),
			}),
		),
	),

	poster: KImage.nullable(),
	thumbnail: KImage.nullable(),
	banner: KImage.nullable(),

	createdAt: zdate(),
	updatedAt: zdate(),
});

export class Season extends EntityMixin(
	typed<z.infer<typeof season>>(class {}),
	{ key: "Season" },
) {
	static parser = season.pipe(z.custom<Season>());
}
