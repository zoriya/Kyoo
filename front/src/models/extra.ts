import { z } from "zod/v4";
import { KImage } from "./utils/images";
import { zdate } from "./utils/utils";

export const Extra = z.object({
	kind: z.enum([
		"other",
		"trailer",
		"interview",
		"behind-the-scene",
		"deleted-scene",
		"blooper",
	]),
	id: z.string(),
	slug: z.string(),
	name: z.string(),
	runtime: z.number().nullable(),
	thumbnail: KImage.nullable(),

	createdAt: zdate(),
	updatedAt: zdate(),

	progress: z.object({
		percent: z.int().min(0).max(100),
		time: z.int().min(0),
		playedDate: zdate().nullable(),
	}),
});
export type Extra = z.infer<typeof Extra>;
