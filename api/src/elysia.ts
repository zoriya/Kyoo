import { Elysia } from "elysia";
import { entries } from "./controllers/entries";
import { movies } from "./controllers/movies";
import { seasonsH } from "./controllers/seasons";
import { seed } from "./controllers/seed";
import { series } from "./controllers/series";
import { videosH } from "./controllers/videos";

import type { KError } from "./models/error";

export const base = new Elysia({ name: "base" })
	.onError(({ code, error }) => {
		if (code === "VALIDATION") {
			const details = JSON.parse(error.message);
			if (details.code === "KError") {
				const { code, ...ret } = details;
				return ret;
			}
			return {
				status: error.status,
				message: `Validation error on ${details.on}.`,
				details: details,
			} as KError;
		}
		if (code === "INTERNAL_SERVER_ERROR") {
			console.error(error);
			return {
				status: 500,
				message: error.message,
				details: error,
			} as KError;
		}
		if (code === "NOT_FOUND") {
			return error;
		}
		console.error(code, error);
		return error;
	})
	.as("plugin");

export const app = new Elysia()
	.use(base)
	.use(movies)
	.use(series)
	.use(entries)
	.use(seasonsH)
	.use(videosH)
	.use(seed);
