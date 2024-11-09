import { Elysia, t } from "elysia";
import { Season } from "../models/season";

export const seasons = new Elysia({ prefix: "/seasons" })
	.model({
		season: Season,
		error: t.Object({}),
	})
	.get("/:id", () => "hello" as unknown as Season, {
		response: { 200: "season" },
	});
