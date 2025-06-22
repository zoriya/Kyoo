import { z } from "zod/v4";

export const KImage = z
	.object({
		id: z.string(),
		source: z.string(),
		blurhash: z.string(),
	})
	.transform((x) => ({
		...x,
		low: `/api/images/${x.id}?quality=low`,
		medium: `/api/images/${x.id}?quality=medium`,
		high: `/api/images/${x.id}?quality=high`,
	}));

export type KImage = z.infer<typeof KImage>;
