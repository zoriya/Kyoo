import Elysia, { t } from "elysia";
import { Movie, SeedMovie } from "~/models/movie";
import { seedMovie } from "./movies";

export const seed = new Elysia()
	.model({
		movie: Movie,
		"seed-movie": SeedMovie,
		error: t.String(),
	})
	.post(
		"/movies",
		async ({ body }) => {
			return await seedMovie(body);
		},
		{
			body: "seed-movie",
			response: { 200: "movie", 400: "error" },
			tags: ["movies"],
		},
	);
