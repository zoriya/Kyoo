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

export const getSeasons = async (
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
		new Request(buildUrl(`series/${serie}/seasons`, opts), {
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

export const getExtras = async (
	serie: string,
	opts: {
		filter?: string;
		limit?: number;
		after?: string;
		sort?: string | string[];
		query?: string;
	},
) => {
	const resp = await app.handle(
		new Request(buildUrl(`series/${serie}/extras`, opts), {
			method: "GET",
		}),
	);
	const body = await resp.json();
	return [resp, body] as const;
};

export const getUnknowns = async (opts: {
	filter?: string;
	limit?: number;
	after?: string;
	sort?: string | string[];
	query?: string;
}) => {
	const resp = await app.handle(
		new Request(buildUrl(`unknowns`, opts), {
			method: "GET",
		}),
	);
	const body = await resp.json();
	return [resp, body] as const;
};
