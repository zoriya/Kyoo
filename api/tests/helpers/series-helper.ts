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

export const getEntries = async (
	serie: string,
	{
		langs,
		...opts
	}: {
		filter?: string;
		limit?: number;
		after?: string;
		sort?: string | string[];
		query?: string;
		langs?: string;
		preferOriginal?: boolean;
	},
) => {
	const resp = await app.handle(
		new Request(buildUrl(`series/${serie}/entries`, opts), {
			method: "GET",
			headers: langs
				? {
						"Accept-Language": langs,
					}
				: {},
		}),
	);
	const body = await resp.json();
	return [resp, body] as const;
};
