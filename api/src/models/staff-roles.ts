import { t } from "elysia";
import { Show } from "./show";
import { Role, Staff } from "./staff";

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
		staff: Staff,
	}),
]);
export type RoleWStaff = typeof RoleWStaff.static;
