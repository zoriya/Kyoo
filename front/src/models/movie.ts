import { EntityMixin } from "@data-client/rest";
import { z } from "zod/v4";
import { Collection } from "./collection";
import { Studio } from "./studio";
import { Genre } from "./utils/genre";
import { KImage } from "./utils/images";
import { Metadata } from "./utils/metadata";
import { typed, zdate } from "./utils/utils";

const movie = z.object({
	kind: z.literal("movie").default("movie"),
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
	status: z.enum(["unknown", "finished", "planned"]),
	rating: z.record(z.string(), z.number().int().gte(0).lte(100)),
	runtime: z.number().int().nullable(),
	airDate: zdate().nullable(),
	genres: z.array(Genre),
	externalId: Metadata,

	poster: KImage.nullable(),
	thumbnail: KImage.nullable(),
	banner: KImage.nullable(),
	logo: KImage.nullable(),
	trailerUrl: z.string().nullable(),

	isAvailable: z.boolean(),

	createdAt: zdate(),
	updatedAt: zdate(),

	studios: z.array(Studio.parser).optional(),
	videos: z
		.array(
			z.object({
				id: z.string(),
				slug: z.string(),
				path: z.string(),
				rendering: z.string(),
				part: z.number().int().gt(0).nullable(),
				version: z.number().gt(0),
			}),
		)
		.optional(),
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
			completedAt: zdate().nullable(),
			percent: z.number().int().gte(0).lte(100),
		})
		.nullable(),
	collection: Collection.parser.optional().nullable(),
});

export class Movie extends EntityMixin(typed<z.infer<typeof movie>>(class {}), {
	key: "Movie",
	schema: { studios: [Studio], collection: Collection },
}) {
	static parser = movie.pipe(z.custom<Movie>());
	static indexes = ["slug" as const];

	get href() {
		return `/movies/${this.slug}`;
	}
	get playHref() {
		return `/watch/${this.videos?.[0]?.slug ?? this.slug}`;
	}
}
