import { Value } from "@sinclair/typebox/value";
import Elysia from "elysia";
import { KError } from "~/models/error";
import { Movie, SeedMovie } from "~/models/movie";
import { Resource } from "~/models/utils";
import { comment } from "~/utils";
import { SeedMovieResponse, seedMovie } from "./movies";

export const seed = new Elysia()
	.model({
		movie: Movie,
		"seed-movie": SeedMovie,
		"seed-movie-response": SeedMovieResponse,
	})
	.post(
		"/movies",
		async ({ body, error }) => {
			// needed due to https://github.com/elysiajs/elysia/issues/671
			body = Value.Decode(SeedMovie, body);

			const ret = await seedMovie(body);
			if (ret.status === 422) return error(422, ret);
			return error(ret.status, ret);
		},
		{
			body: "seed-movie",
			response: {
				200: {
					...SeedMovieResponse,
					description: "Existing movie edited/updated.",
				},
				201: { ...SeedMovieResponse, description: "Created a new movie." },
				409: {
					...Resource,
					description: comment`
						A movie with the same slug but a different air date already exists.
						Change the slug and re-run the request.
					`,
				},
				422: { ...KError, description: "Invalid schema in body." },
			},
			detail: {
				tags: ["movies"],
				description:
					"Create a movie & all related metadata. Can also link videos.",
			},
		},
	);
