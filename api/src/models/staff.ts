import { t } from "elysia";
import { bubbleImages, madeInAbyss, registerExamples } from "./examples";
import { DbMetadata, ExternalId, Image, Resource, SeedImage } from "./utils";

export const Character = t.Object({
	name: t.String(),
	latinName: t.Nullable(t.String()),
	image: t.Nullable(Image),
});
export type Character = typeof Character.static;

export const Role = t.Object({
	kind: t.UnionEnum([
		"actor",
		"director",
		"writter",
		"producer",
		"music",
		"crew",
		"other",
	]),
	character: t.Nullable(Character),
});
export type Role = typeof Role.static;

const StaffData = t.Object({
	name: t.String(),
	latinName: t.Nullable(t.String()),
	image: t.Nullable(Image),
	externalId: ExternalId(),
});
export const Staff = t.Composite([Resource(), StaffData, DbMetadata]);
export type Staff = typeof Staff.static;

export const SeedStaff = t.Composite([
	t.Omit(Role, ["character"]),
	t.Object({
		character: t.Composite([
			t.Omit(Character, ["image"]),
			t.Object({
				image: t.Nullable(SeedImage),
			}),
		]),
		staff: t.Composite([
			t.Object({
				slug: t.String({ format: "slug" }),
				image: t.Nullable(SeedImage),
			}),
			t.Omit(StaffData, ["image"]),
		]),
	}),
]);
export type SeedStaff = typeof SeedStaff.static;

const role = madeInAbyss.staff[0];
registerExamples(SeedStaff, role);
registerExamples(Staff, {
	...role.staff,
	image: {
		id: bubbleImages.poster.id,
		source: role.staff.image,
		blurhash: bubbleImages.poster.blurhash,
	},
});
registerExamples(Role, {
	...role,
	character: {
		...role.character,
		image: {
			id: bubbleImages.poster.id,
			source: role.character.image,
			blurhash: bubbleImages.poster.blurhash,
		},
	},
});
