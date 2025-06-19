import z from "zod";

export const Entry = z.object({
	id: z.string(),
	slug: z.string(),
});
export type Entry = z.infer<typeof Entry>;
