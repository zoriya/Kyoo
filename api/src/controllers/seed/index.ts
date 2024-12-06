import Elysia, { t } from "elysia";
import { Movie, SeedMovie } from "~/models/movie";
import { seedMovie, SeedMovieResponse } from "./movies";
import { Resource } from "~/models/utils";
import { comment } from "~/utils";

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
			return error(status, ret);
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
				409: {
					...Resource,
					description: comment`
						A movie with the same slug but a different air date already exists.
						Change the slug and re-run the request.
					`,
				},
			},
			detail: {
				tags: ["movies"],
				description:
					"Create a movie & all related metadata. Can also link videos.",
			},
		},
	);
