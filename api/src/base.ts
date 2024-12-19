import Elysia from "elysia";
import type { KError } from "./models/error";

export const base = new Elysia({ name: "base" })
	.onError(({code, error}) => {
		if (code === "VALIDATION") {
			const details = JSON.parse(error.message);
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
	})
	.as("plugin");
