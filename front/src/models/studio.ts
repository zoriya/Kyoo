import { z } from "zod/v4";
import { KImage } from "./utils/images";
import { Metadata } from "./utils/metadata";
import { zdate } from "./utils/utils";

export const Studio = z.object({
	id: z.string(),
	slug: z.string(),
	name: z.string(),
	logo: KImage.nullable(),
	externalId: Metadata,
	createdAt: zdate(),
	updatedAt: zdate(),
});
export type Studio = z.infer<typeof Studio>;
