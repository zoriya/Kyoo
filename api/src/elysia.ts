import { Elysia } from "elysia";
import { entriesH } from "./controllers/entries";
import { seasonsH } from "./controllers/seasons";
import { seed } from "./controllers/seed";
import { collections } from "./controllers/shows/collections";
import { movies } from "./controllers/shows/movies";
import { series } from "./controllers/shows/series";
import { showsH } from "./controllers/shows/shows";
import { studiosH } from "./controllers/studios";
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
	.use(showsH)
	.use(movies)
	.use(series)
	.use(collections)
	.use(entriesH)
	.use(seasonsH)
	.use(videosH)
	.use(studiosH)
	.use(seed);
