import { t } from "elysia";

export const KError = t.Object(
	{
		status: t.Integer(),
		message: t.String(),
		details: t.Optional(t.Any()),
	},
	{
		description: "Invalid parameters.",
		examples: [{ status: 404, message: "Movie not found" }],
	},
);
export type KError = typeof KError.static;

export class KErrorT extends Error {
	constructor(message: string, details?: any) {
		super(JSON.stringify({ code: "KError", status: 422, message, details }));
	}
}
