import { Elysia, t } from "elysia";
import { Serie } from "../models/serie";

export const series = new Elysia({ prefix: "/series" })
	.model({
		serie: Serie,
		error: t.Object({}),
	})
	.get("/:id", () => "hello" as unknown as Serie, {
		response: { 200: "serie" },
	});
