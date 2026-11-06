import { EntityMixin } from "@data-client/rest";
import { z } from "zod/v4";
import { Show } from "./show";
import { KImage } from "./utils/images";
import { Metadata } from "./utils/metadata";
import { typed, zdate } from "./utils/utils";

const character = z.object({
	name: z.string(),
	latinName: z.string().nullable(),
	image: KImage.nullable(),
});
export type Character = z.infer<typeof character>;

const staff = z.object({
	id: z.string(),
	slug: z.string(),
	name: z.string(),
	latinName: z.string().nullable(),
	image: KImage.nullable(),
	externalId: Metadata,
	createdAt: zdate(),
	updatedAt: zdate(),
});

export class Staff extends EntityMixin(typed<z.infer<typeof staff>>(class {}), {
	key: "Staff",
}) {
	static parser = staff.pipe(z.custom<Staff>());
}

const role = z.object({
	id: z.string(),
	kind: z.enum([
		"actor",
		"director",
		"writter",
		"producer",
		"music",
		"crew",
		"other",
	]),
	character: character.nullable(),
	staff: Staff.parser.optional(),
	show: Show.parser.optional(),
});

export class Role extends EntityMixin(typed<z.infer<typeof role>>(class {}), {
	key: "Role",
	schema: { staff: Staff, show: Show },
}) {
	static parser = role.pipe(z.custom<Role>());
}
