import { z } from "zod";

export const Metadata = z.record(
	z.object({
		dataId: z.string(),
		link: z.string().nullable(),
	}),
);
export type Metadata = z.infer<typeof Metadata>;
