import { Value } from "@sinclair/typebox/value";
import Elysia from "elysia";
import { KError } from "~/models/error";
import { SeedMovie } from "~/models/movie";
import { SeedSerie } from "~/models/serie";
import { Resource } from "~/models/utils";
import { comment } from "~/utils";
import { SeedMovieResponse, seedMovie } from "./movies";
import { SeedSerieResponse, seedSerie } from "./series";

export const seed = new Elysia()
	.model({
		"seed-movie": SeedMovie,
		"seed-movie-response": SeedMovieResponse,
		"seed-serie": SeedSerie,
		"seed-serie-response": SeedSerieResponse,
	})
	.post(
		"/movies",
		async ({ body, error }) => {
			// needed due to https://github.com/elysiajs/elysia/issues/671
			const movie = Value.Decode(SeedMovie, body) as SeedMovie;

			const ret = await seedMovie(movie);
			if ("status" in ret) return error(ret.status, ret as any);
			return error(ret.updated ? 200 : 201, ret);
		},
		{
			detail: {
				tags: ["movies"],
				description:
					"Create a movie & all related metadata. Can also link videos.",
			},
			body: SeedMovie,
			response: {
				200: {
					...SeedMovieResponse,
					description: "Existing movie edited/updated.",
				},
				201: { ...SeedMovieResponse, description: "Created a new movie." },
				409: {
					...Resource(),
					description: comment`
						A movie with the same slug but a different air date already exists.
						Change the slug and re-run the request.
					`,
				},
				422: KError,
			},
		},
	)
	.post(
		"/series",
		async ({ body, error }) => {
			// needed due to https://github.com/elysiajs/elysia/issues/671
			const serie = Value.Decode(SeedSerie, body) as SeedSerie;

			const ret = await seedSerie(serie);
			if ("status" in ret) return error(ret.status, ret as any);
			return error(ret.updated ? 200 : 201, ret);
		},
		{
			detail: {
				tags: ["series"],
				description:
					"Create a series & all related metadata. Can also link videos.",
			},
			body: SeedSerie,
			response: {
				200: {
					...SeedSerieResponse,
					description: "Existing serie edited/updated.",
				},
				201: { ...SeedSerieResponse, description: "Created a new serie." },
				409: {
					...Resource(),
					description: comment`
						A serie with the same slug but a different air date already exists.
						Change the slug and re-run the request.
					`,
				},
				422: KError,
			},
		},
	);
