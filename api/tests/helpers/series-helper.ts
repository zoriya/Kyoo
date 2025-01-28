import { buildUrl } from "tests/utils";
import { app } from "~/elysia";
import type { SeedSerie } from "~/models/serie";

export const createSerie = async (serie: SeedSerie) => {
	const resp = await app.handle(
		new Request(buildUrl("series"), {
			method: "POST",
			body: JSON.stringify(serie),
			headers: {
				"Content-Type": "application/json",
			},
		}),
	);
	const body = await resp.json();
	return [resp, body] as const;
};
