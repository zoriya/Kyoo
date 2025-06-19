import { z } from "zod";

export const Image = z
	.object({
		id: z.string(),
		source: z.string(),
		blurhash: z.string(),
	})
	.transform((x) => ({
		...x,
		low: `/images/${x.id}?quality=low`,
		medium: `/images/${x.id}?quality=medium`,
		high: `/images/${x.id}?quality=high`,
	}));

export type Image = z.infer<typeof Image>;
