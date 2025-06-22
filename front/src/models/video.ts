import { z } from "zod/v4";

export const EmbeddedVideo = z.object({
	id: z.string(),
	slug: z.string(),
	path: z.string(),
	rendering: z.string(),
	part: z.number().int().gt(0).nullable(),
	version: z.number().gt(0),
});
export type EmbeddedVideo = z.infer<typeof EmbeddedVideo>;
