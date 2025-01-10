import { Elysia, t } from "elysia";
import {
	type Entry,
	Episode,
	Extra,
	MovieEntry,
	Special,
	UnknownEntry,
} from "../models/entry";

export const entries = new Elysia()
	.model({
		episode: Episode,
		movie_entry: MovieEntry,
		special: Special,
		extra: Extra,
		unknown_entry: UnknownEntry,
		error: t.Object({}),
	})
	.model((models) => ({
		...models,
		entry: t.Union([models.episode, models.movie_entry, models.special]),
	}))
	.get("/entries/:id", () => "hello" as unknown as Entry, {
		response: { 200: "entry" },
	})
	.get("/extras/:id", () => "hello" as unknown as Extra, {
		response: { 200: "extra" },
	})
	.get("/unknowns/:id", () => "hello" as unknown as UnknownEntry, {
		response: { 200: "unknown_entry" },
	});
