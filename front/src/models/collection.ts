import { EntityMixin } from "@data-client/rest";
import { z } from "zod/v4";
import { Genre } from "./utils/genre";
import { KImage } from "./utils/images";
import { Metadata } from "./utils/metadata";
import { typed, zdate } from "./utils/utils";

const collection = z.object({
	kind: z.literal("collection").default("collection"),
	id: z.string(),
	slug: z.string(),
	name: z.string(),
	original: z.object({
		name: z.string().nullable(),
		latinName: z.string().nullable(),
		language: z.string(),
	}),
	tagline: z.string().nullable(),
	aliases: z.array(z.string()),
	tags: z.array(z.string()),
	description: z.string().nullable(),
	rating: z.record(z.string(), z.number().int().gte(0).lte(100)),
	startAir: zdate().nullable(),
	endAir: zdate().nullable(),
	genres: z.array(Genre),
	externalId: Metadata,

	poster: KImage.nullable(),
	thumbnail: KImage.nullable(),
	banner: KImage.nullable(),
	logo: KImage.nullable(),

	createdAt: zdate(),
	updatedAt: zdate(),
});

export class Collection extends EntityMixin(
	typed<z.infer<typeof collection>>(class {}),
	{ key: "Collection" },
) {
	static parser = collection.pipe(z.custom<Collection>());
	static indexes = ["slug" as const];

	get href() {
		return `/collections/${this.slug}`;
	}
}
