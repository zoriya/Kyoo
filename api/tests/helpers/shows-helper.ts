import { buildUrl } from "tests/utils";
import { handlers } from "~/base";
import { getJwtHeaders } from "./jwt";

export const getShows = async ({
	langs,
	...query
}: {
	filter?: string;
	limit?: number;
	after?: string;
	sort?: string | string[];
	query?: string;
	langs?: string;
	preferOriginal?: boolean;
}) => {
	const resp = await handlers.handle(
		new Request(buildUrl("shows", query), {
			method: "GET",
			headers: langs
				? {
						"Accept-Language": langs,
						...(await getJwtHeaders()),
					}
				: await getJwtHeaders(),
		}),
	);
	const body = await resp.json();
	return [resp, body] as const;
};

export const getWatchlist = async (
	id: string,
	{
		langs,
		...query
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
	const resp = await handlers.handle(
		new Request(buildUrl(`profiles/${id}/watchlist`, query), {
			method: "GET",
			headers: langs
				? {
						"Accept-Language": langs,
						...(await getJwtHeaders()),
					}
				: await getJwtHeaders(),
		}),
	);
	const body = await resp.json();
	return [resp, body] as const;
};

export const getNextup = async (
	id: string,
	{
		langs,
		...query
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
	const resp = await handlers.handle(
		new Request(buildUrl(`profiles/${id}/nextup`, query), {
			method: "GET",
			headers: langs
				? {
						"Accept-Language": langs,
						...(await getJwtHeaders()),
					}
				: await getJwtHeaders(),
		}),
	);
	const body = await resp.json();
	return [resp, body] as const;
};
