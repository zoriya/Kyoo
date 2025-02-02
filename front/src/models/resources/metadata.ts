import { z } from "zod";

export const MetadataP = z.preprocess(
	(x) =>
		typeof x === "object" && x ? Object.fromEntries(Object.entries(x).filter(([_, v]) => v)) : x,
	z.record(
		z.object({
			/*
			 * The ID of the resource on the external provider.
			 */
			dataId: z.string(),

			/*
			 * The URL of the resource on the external provider.
			 */
			link: z.string().nullable(),
		}),
	),
);

export type Metadata = z.infer<typeof MetadataP>;
