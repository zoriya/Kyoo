import { EntityMixin } from "@data-client/rest";
import { z } from "zod/v4";
import { KImage } from "./utils/images";
import { Metadata } from "./utils/metadata";
import { typed, zdate } from "./utils/utils";

const studio = z.object({
	id: z.string(),
	slug: z.string(),
	name: z.string(),
	logo: KImage.nullable(),
	externalId: Metadata,
	createdAt: zdate(),
	updatedAt: zdate(),
});

export class Studio extends EntityMixin(
	typed<z.infer<typeof studio>>(class {}),
	{ key: "Studio" },
) {
	static parser = studio.pipe(z.custom<Studio>());
}
