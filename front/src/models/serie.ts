import { EntityMixin } from "@data-client/rest";
import { z } from "zod/v4";
import { Collection } from "./collection";
import { Entry } from "./entry";
import { Studio } from "./studio";
import { Genre } from "./utils/genre";
import { KImage } from "./utils/images";
import { Metadata } from "./utils/metadata";
import { typed, zdate } from "./utils/utils";

const serie = z.object({
	kind: z.literal("serie").default("serie"),
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
	status: z.enum(["unknown", "finished", "airing", "planned"]),
	rating: z.record(z.string(), z.number().int().gte(0).lte(100)),
	startAir: zdate().nullable(),
	endAir: zdate().nullable(),
	genres: z.array(Genre),
	runtime: z.number().nullable(),
	externalId: Metadata,

	poster: KImage.nullable(),
	thumbnail: KImage.nullable(),
	banner: KImage.nullable(),
	logo: KImage.nullable(),
	trailerUrl: z.string().nullable(),

	entriesCount: z.int().gte(0),
	availableCount: z.int().gte(0),

	createdAt: zdate(),
	updatedAt: zdate(),

	studios: z.array(Studio.parser).optional(),
	watchStatus: z
		.object({
			status: z.enum([
				"completed",
				"watching",
				"rewatching",
				"dropped",
				"planned",
			]),
			score: z.number().int().gte(0).lte(100).nullable(),
			startedAt: zdate().nullable(),
			completedAt: zdate().nullable(),
			seenCount: z.number().int().gte(0),
		})
		.nullable(),

	collection: Collection.parser.optional().nullable(),
	firstEntry: z
		.lazy((): z.ZodType => Entry.parser)
		.optional()
		.nullable(),
	nextEntry: z
		.lazy((): z.ZodType => Entry.parser)
		.optional()
		.nullable(),
});

// the lazy entries can't be typed from zod, the types would loop too
type WithEntries = { firstEntry?: Entry | null; nextEntry?: Entry | null };

export class Serie extends EntityMixin(
	typed<z.infer<typeof serie> & WithEntries>(class {}),
	{
		key: "Serie",
		schema: {
			studios: [Studio],
			get firstEntry() {
				return Entry;
			},
			get nextEntry() {
				return Entry;
			},
			collection: Collection,
		},
	},
) {
	static parser = serie.pipe(z.custom<Serie>());
	static indexes = ["slug" as const];

	get href() {
		return `/series/${this.slug}`;
	}
	get playHref() {
		return (this.nextEntry ?? this.firstEntry)?.href ?? null;
	}
}
