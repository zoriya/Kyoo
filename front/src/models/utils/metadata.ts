import { z } from "zod/v4";

export const Metadata = z.record(
	z.string(),
	z.object({
		dataId: z.string(),
		link: z.string().nullable(),
	}),
);
export type Metadata = z.infer<typeof Metadata>;
