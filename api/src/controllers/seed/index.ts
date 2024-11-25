import Elysia, { t } from "elysia";
import { Movie, SeedMovie } from "~/models/movie";
import { seedMovie, SeedMovieResponse } from "./movies";

export const seed = new Elysia()
	.model({
		movie: Movie,
		"seed-movie": SeedMovie,
		"seed-movie-response": SeedMovieResponse,
		error: t.String(),
	})
	.post(
		"/movies",
		async ({ body }) => {
			return await seedMovie(body);
		},
		{
			body: "seed-movie",
			response: { 200: "seed-movie-response", 400: "error" },
			tags: ["movies"],
		},
	);
