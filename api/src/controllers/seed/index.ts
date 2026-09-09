import { and, eq } from "drizzle-orm";
import Elysia, { t } from "elysia";
import { db } from "~/db";
import { shows } from "~/db/schema";
import { publish } from "~/events";
import { KError } from "~/models/error";
import { SeedMovie } from "~/models/movie";
import { SeedSerie } from "~/models/serie";
import { isUuid, Resource } from "~/models/utils";
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
		async ({ body, status }) => {
			const ret = await seedMovie(body);
			if ("status" in ret) return status(ret.status, ret as any);
			publish({ collection: "shows", op: "invalidate", ids: [ret.id] });
			// @ts-expect-error idk why
			return status(ret.updated ? 200 : 201, ret);
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
		async ({ body, status }) => {
			const ret = await seedSerie(body);
			if ("status" in ret) return status(ret.status, ret as any);
			publish({ collection: "shows", op: "invalidate", ids: [ret.id] });
			// @ts-expect-error idk why
			return status(ret.updated ? 200 : 201, ret);
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
	)
	.delete(
		"/movies/:id",
		async ({ params: { id }, status }) => {
			const [deleted] = await db
				.delete(shows)
				.where(
					and(
						eq(shows.kind, "movie"),
						isUuid(id) ? eq(shows.id, id) : eq(shows.slug, id),
					),
				)
				.returning({ id: shows.id, slug: shows.slug });
			if (!deleted) {
				return status(404, {
					status: 404,
					message: "No movie found with the given id or slug.",
				});
			}
			publish({ collection: "shows", op: "delete", ids: [deleted.id] });
			return deleted;
		},
		{
			detail: {
				tags: ["movies"],
				description: "Delete a movie by id or slug.",
			},
			params: t.Object({
				id: t.String({
					description: "The id or slug of the movie to delete.",
				}),
			}),
			response: {
				200: Resource(),
				404: {
					...KError,
					description: "No movie found with the given id or slug.",
				},
			},
		},
	)
	.delete(
		"/series/:id",
		async ({ params: { id }, status }) => {
			const [deleted] = await db
				.delete(shows)
				.where(
					and(
						eq(shows.kind, "serie"),
						isUuid(id) ? eq(shows.id, id) : eq(shows.slug, id),
					),
				)
				.returning({ id: shows.id, slug: shows.slug });
			if (!deleted) {
				return status(404, {
					status: 404,
					message: "No serie found with the given id or slug.",
				});
			}
			publish({ collection: "shows", op: "delete", ids: [deleted.id] });
			return deleted;
		},
		{
			detail: {
				tags: ["series"],
				description: "Delete a serie by id or slug.",
			},
			params: t.Object({
				id: t.String({
					description: "The id or slug of the serie to delete.",
				}),
			}),
			response: {
				200: Resource(),
				404: {
					...KError,
					description: "No serie found with the given id or slug.",
				},
			},
		},
	)
	.delete(
		"/collections/:id",
		async ({ params: { id }, status }) => {
			const [deleted] = await db
				.delete(shows)
				.where(
					and(
						eq(shows.kind, "collection"),
						isUuid(id) ? eq(shows.id, id) : eq(shows.slug, id),
					),
				)
				.returning({ id: shows.id, slug: shows.slug });
			if (!deleted) {
				return status(404, {
					status: 404,
					message: "No collection found with the given id or slug.",
				});
			}
			publish({ collection: "shows", op: "delete", ids: [deleted.id] });
			return deleted;
		},
		{
			detail: {
				tags: ["collections"],
				description: "Delete a collection by id or slug.",
			},
			params: t.Object({
				id: t.String({
					description: "The id or slug of the collection to delete.",
				}),
			}),
			response: {
				200: Resource(),
				404: {
					...KError,
					description: "No collection found with the given id or slug.",
				},
			},
		},
	);
