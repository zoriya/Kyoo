import Elysia from "elysia";
import { buildUrl } from "tests/utils";
import { base } from "~/base";
import { movies } from "~/controllers/movies";
import { seed } from "~/controllers/seed";
import { series } from "~/controllers/series";
import { videos } from "~/controllers/videos";
import type { SeedMovie } from "~/models/movie";
import type { SeedVideo } from "~/models/video";

export const app = new Elysia()
	.use(base)
	.use(movies)
	.use(series)
	.use(videos)
	.use(seed);

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

export const createVideo = async (video: SeedVideo | SeedVideo[]) => {
	const resp = await app.handle(
		new Request(buildUrl("videos"), {
			method: "POST",
			body: JSON.stringify(Array.isArray(video) ? video : [video]),
			headers: {
				"Content-Type": "application/json",
			},
		}),
	);
	const body = await resp.json();
	return [resp, body] as const;
};
