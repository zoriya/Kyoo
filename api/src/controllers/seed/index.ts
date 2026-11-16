import { and, eq } from "drizzle-orm";
import Elysia, { t } from "elysia";
import { db } from "~/db";
import { shows } from "~/db/schema";
import { KError } from "~/models/error";
import { SeedMovie } from "~/models/movie";
import { SeedSerie } from "~/models/serie";
import { isUuid, Resource } from "~/models/utils";
import { comment } from "~/utils";
import { broadcast } from "~/websockets";
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
					...t.Union([Resource(), KError]),
					description: comment`
						A movie with the same slug but a different air date already exists.
						Change the slug and re-run the request.

						Or a movie with the same external ids already exists (\`details\` contains its id & slug).
						Use \`PUT /movies/{id}\` to update it.
					`,
				},
				422: KError,
			},
		},
	)
	.put(
		"/movies/:id",
		async ({ params: { id }, body, status }) => {
			const [existing] = await db
				.select({ pk: shows.pk })
				.from(shows)
				.where(and(eq(shows.kind, "movie"), eq(shows.id, id)))
				.limit(1);
			if (!existing) {
				return status(404, {
					status: 404,
					message: "No movie found with the given id.",
				});
			}
			const ret = await seedMovie(body, id);
			if ("status" in ret) return status(ret.status, ret as any);
			return ret;
		},
		{
			detail: {
				tags: ["movies"],
				description: "Update an existing movie & all related metadata.",
			},
			params: t.Object({
				id: t.String({
					format: "uuid",
					description: "The id of the movie to update.",
				}),
			}),
			body: t.Composite([
				t.Omit(SeedMovie, ["slug"]),
				t.Object({
					slug: t.Optional(
						t.String({
							format: "slug",
							description:
								"Rename the movie. Leave it unset to keep the current slug.",
						}),
					),
				}),
			]),
			response: {
				200: SeedMovieResponse,
				404: {
					...KError,
					description: "No movie found with the given id.",
				},
				409: {
					...KError,
					description: comment`
						Another movie with the same external ids already exists (\`details\` contains its id & slug).
						Or the new slug is already used.
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
					...t.Union([Resource(), KError]),
					description: comment`
						A serie with the same slug but a different air date already exists.
						Change the slug and re-run the request.

						Or a serie with the same external ids already exists (\`details\` contains its id & slug).
						Use \`PUT /series/{id}\` to update it.
					`,
				},
				422: KError,
			},
		},
	)
	.put(
		"/series/:id",
		async ({ params: { id }, body, status }) => {
			const [existing] = await db
				.select({ pk: shows.pk })
				.from(shows)
				.where(and(eq(shows.kind, "serie"), eq(shows.id, id)))
				.limit(1);
			if (!existing) {
				return status(404, {
					status: 404,
					message: "No serie found with the given id.",
				});
			}
			const ret = await seedSerie(body, id);
			if ("status" in ret) return status(ret.status, ret as any);
			return ret;
		},
		{
			detail: {
				tags: ["series"],
				description: "Update an existing serie & all related metadata.",
			},
			params: t.Object({
				id: t.String({
					format: "uuid",
					description: "The id of the serie to update.",
				}),
			}),
			body: t.Composite([
				t.Omit(SeedSerie, ["slug"]),
				t.Object({
					slug: t.Optional(
						t.String({
							format: "slug",
							description:
								"Rename the serie. Leave it unset to keep the current slug.",
						}),
					),
				}),
			]),
			response: {
				200: SeedSerieResponse,
				404: {
					...KError,
					description: "No serie found with the given id.",
				},
				409: {
					...KError,
					description: comment`
						Another serie with the same external ids already exists (\`details\` contains its id & slug).
						Or the new slug is already used.
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
			await broadcast(db, { action: "deleted", kind: "movie", ...deleted });
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
			await broadcast(db, { action: "deleted", kind: "serie", ...deleted });
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
			await broadcast(db, {
				action: "deleted",
				kind: "collection",
				...deleted,
			});
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
