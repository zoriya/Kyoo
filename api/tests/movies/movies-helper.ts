import Elysia from "elysia";
import { buildUrl } from "tests/utils";
import { base } from "~/base";
import { movies } from "~/controllers/movies";
import { seed } from "~/controllers/seed";
import type { SeedMovie } from "~/models/movie";

export const movieApp = new Elysia().use(base).use(movies).use(seed);

export const getMovie = async (id: string, langs?: string) => {
	const resp = await movieApp.handle(
		new Request(`http://localhost/movies/${id}`, {
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
	random?: number;
	langs?: string;
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
		new Request("http://localhost/movies", {
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
