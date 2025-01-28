import { buildUrl } from "tests/utils";
import { app } from "~/elysia";
import type { SeedMovie } from "~/models/movie";

export const getMovie = async (
	id: string,
	{ langs, ...query }: { langs?: string; preferOriginal?: boolean },
) => {
	const resp = await app.handle(
		new Request(buildUrl(`movies/${id}`, query), {
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
	const resp = await app.handle(
		new Request(buildUrl("movies", query), {
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

export const createMovie = async (movie: SeedMovie) => {
	const resp = await app.handle(
		new Request(buildUrl("movies"), {
			method: "POST",
			body: JSON.stringify(movie),
			headers: {
				"Content-Type": "application/json",
			},
		}),
	);
	const body = await resp.json();
	return [resp, body] as const;
};
