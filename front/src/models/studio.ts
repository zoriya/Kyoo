import { z } from "zod";
import { Image } from "./utils/images";
import { Metadata } from "./utils/metadata";
import { zdate } from "./utils/utils";

export const Studio = z.object({
	id: z.string(),
	slug: z.string(),
	name: z.string(),
	logo: Image.nullable(),
	externalId: Metadata,
	createdAt: zdate(),
	updatedAt: zdate(),
});
export type Studio = z.infer<typeof Studio>;
