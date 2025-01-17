import Elysia from "elysia";
import { buildUrl } from "tests/utils";
import { base } from "~/base";
import { movies } from "~/controllers/movies";
import { seed } from "~/controllers/seed";
import type { SeedMovie } from "~/models/movie";

export const movieApp = new Elysia().use(base).use(movies).use(seed);

export const getMovie = async (
	id: string,
	{ langs, ...query }: { langs?: string; preferOriginal?: boolean },
) => {
	const resp = await movieApp.handle(
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
	langs?: string;
	preferOriginal?: boolean;
}) => {
	const resp = await movieApp.handle(
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
	const resp = await movieApp.handle(
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
