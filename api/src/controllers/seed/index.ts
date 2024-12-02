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
		async ({ body, error }) => {
			const { status, ...ret } = await seedMovie(body);
			return error(status === "created" ? 201 : 200, ret);
		},
		{
			body: "seed-movie",
			response: {
				200: {
					...SeedMovieResponse,
					description: "Existing movie edited/updated.",
				},
				201: { ...SeedMovieResponse, description: "Created a new movie." },
				400: "error",
			},
			detail: {
				tags: ["movies"],
				description:
					"Create a movie & all related metadata. Can also link videos.",
			},
		},
	);
