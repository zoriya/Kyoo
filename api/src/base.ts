import { Elysia, t } from "elysia";
import { auth } from "./auth";
import { entriesH } from "./controllers/entries";
import { imagesH } from "./controllers/images";
import { seasonsH } from "./controllers/seasons";
import { seed } from "./controllers/seed";
import { collections } from "./controllers/shows/collections";
import { movies } from "./controllers/shows/movies";
import { series } from "./controllers/shows/series";
import { showsH } from "./controllers/shows/shows";
import { staffH } from "./controllers/staff";
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
			details.errors = details.errors.map((x: any) => {
				const { schema, ...err } = x;
				return err;
			});
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
	.get("/health", () => ({ status: "healthy" }) as const, {
		detail: { description: "Check if the api is healthy." },
		response: { 200: t.Object({ status: t.Literal("healthy") }) },
	})
	.as("plugin");

export const prefix = process.env.KYOO_PREFIX ?? "";
export const app = new Elysia({ prefix })
	.use(base)
	.use(auth)
	.guard(
		{
			// Those are not applied for now. See https://github.com/elysiajs/elysia/issues/1139
			detail: {
				security: [{ bearer: ["core.read"] }, { api: ["core.read"] }],
			},
			// See https://github.com/elysiajs/elysia/issues/1158
			// response: {
			// 	401: { ...KError, description: "" },
			// 	403: { ...KError, description: "" },
			// },
			permissions: ["core.read"],
		},
		(app) =>
			app
				.use(showsH)
				.use(movies)
				.use(series)
				.use(collections)
				.use(entriesH)
				.use(seasonsH)
				.use(studiosH)
				.use(staffH)
				.use(imagesH),
	)
	.guard(
		{
			detail: {
				security: [{ bearer: ["core.write"] }, { api: ["core.write"] }],
			},
			// See https://github.com/elysiajs/elysia/issues/1158
			// response: {
			// 	401: { ...KError, description: "" },
			// 	403: { ...KError, description: "" },
			// },
			permissions: ["core.write"],
		},
		(app) => app.use(videosH).use(seed),
	);
