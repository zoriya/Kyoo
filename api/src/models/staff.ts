import { t } from "elysia";
import { Show } from "./show";
import { DbMetadata, ExternalId, Image, Resource } from "./utils";

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

export const Staff = t.Intersect([
	Resource(),
	t.Object({
		name: t.String(),
		latinName: t.Nullable(t.String()),
		image: t.Nullable(Image),
		externalId: ExternalId(),
	}),
	DbMetadata,
]);
export type Staff = typeof Staff.static;

export const RoleWShow = t.Intersect([
	Role,
	t.Object({
		show: Show,
	}),
]);
export type RoleWShow = typeof RoleWShow.static;

export const RoleWStaff = t.Intersect([
	Role,
	t.Object({
		staff: Staff
	}),
]);
export type RoleWStaff = typeof RoleWStaff.static;
