import Elysia from "elysia";
import type { KError } from "./models/error";

export const base = new Elysia({ name: "base" })
	.onError(({ code, error }) => {
		if (code === "VALIDATION") {
			return {
				status: error.status,
				message: error.message,
				details: error,
			} as KError;
		}
		if (code === "INTERNAL_SERVER_ERROR") {
			return {
				status: 500,
				message: error.message,
				details: error,
			} as KError;
		}
	})
	.as("plugin");
