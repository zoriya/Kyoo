import { t } from "elysia";

export const KError = t.Object({
	status: t.Integer(),
	message: t.String(),
	details: t.Any(),
});
export type KError = typeof KError.static;
