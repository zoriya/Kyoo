import { t } from "elysia";
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
export const Staff = t.Intersect([Resource(), StaffData, DbMetadata]);
export type Staff = typeof Staff.static;

export const SeedStaff = t.Intersect([
	t.Omit(Role, ["character"]),
	t.Object({
		character: t.Intersect([
			t.Omit(Character, ["image"]),
			t.Object({
				image: t.Nullable(SeedImage),
			}),
		]),
		staff: t.Intersect([
			t.Object({
				slug: t.String({ format: "slug" }),
				image: t.Nullable(SeedImage),
			}),
			t.Omit(StaffData, ["image"]),
		]),
	}),
]);
export type SeedStaff = typeof SeedStaff.static;
