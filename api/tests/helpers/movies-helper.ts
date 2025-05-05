import { buildUrl } from "tests/utils";
import { handlers } from "~/base";
import type { SeedMovie } from "~/models/movie";
import type { MovieWatchStatus } from "~/models/watchlist";
import { getJwtHeaders } from "./jwt";

export const getMovie = async (
	id: string,
	{
		langs,
		...query
	}: { langs?: string; preferOriginal?: boolean; with?: string[] },
) => {
	const resp = await handlers.handle(
		new Request(buildUrl(`movies/${id}`, query), {
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

export const getMovies = async ({
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
		new Request(buildUrl("movies", query), {
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

export const createMovie = async (movie: SeedMovie) => {
	const resp = await handlers.handle(
		new Request(buildUrl("movies"), {
			method: "POST",
			body: JSON.stringify(movie),
			headers: {
				"Content-Type": "application/json",
				...(await getJwtHeaders()),
			},
		}),
	);
	const body = await resp.json();
	return [resp, body] as const;
};

export const setMovieStatus = async (
	id: string,
	status: Omit<MovieWatchStatus, "percent">,
) => {
	const resp = await handlers.handle(
		new Request(buildUrl(`movies/${id}/watchstatus`), {
			method: "POST",
			body: JSON.stringify(status),
			headers: {
				"Content-Type": "application/json",
				...(await getJwtHeaders()),
			},
		}),
	);
	const body = await resp.json();
	return [resp, body] as const;
};
