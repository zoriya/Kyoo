import { z } from "zod/v4";

export const Entry = z.object({
	id: z.string(),
	slug: z.string(),
});
export type Entry = z.infer<typeof Entry>;
