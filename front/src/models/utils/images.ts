import { z } from "zod/v4";

export const KImage = z
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

export type KImage = z.infer<typeof KImage>;
