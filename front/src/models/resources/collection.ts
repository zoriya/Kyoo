import { z } from "zod";
import { ImagesP, ResourceP } from "../traits";

export const CollectionP = ResourceP("collection")
	.merge(ImagesP)
	.extend({
		/**
		 * The title of this collection.
		 */
		name: z.string(),
		/**
		 * The summary of this show.
		 */
		overview: z.string().nullable(),
	})
	.transform((x) => ({
		...x,
		href: `/collection/${x.slug}`,
	}));

/**
 * A class representing collections of show or movies.
 */
export type Collection = z.infer<typeof CollectionP>;
