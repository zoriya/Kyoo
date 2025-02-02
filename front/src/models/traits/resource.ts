import { z } from "zod";

export const ResourceP = <T extends string>(kind: T) =>
	z.object({
		/**
		 * A unique ID for this type of resource. This can't be changed and duplicates are not allowed.
		 */
		id: z.string(),

		/**
		 * A human-readable identifier that can be used instead of an ID. A slug must be unique for a type
		 * of resource but it can be changed.
		 */
		slug: z.string(),

		/**
		 * The type of resource
		 */
		kind: z.literal(kind),
	});

/**
 * The base trait used to represent identifiable resources.
 */
export type Resource = z.infer<ReturnType<typeof ResourceP>>;
