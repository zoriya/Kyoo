import { and, eq, sql } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { auth } from "~/auth";
import { prefix } from "~/base";
import { db } from "~/db";
import { shows } from "~/db/schema";
import {
	Collection,
	CollectionTranslation,
	FullCollection,
} from "~/models/collections";
import { KError } from "~/models/error";
import { duneCollection } from "~/models/examples";
import { Movie } from "~/models/movie";
import { Serie } from "~/models/serie";
import { Show } from "~/models/show";
import {
	AcceptLanguage,
	createPage,
	Filter,
	isUuid,
	Page,
	processLanguages,
} from "~/models/utils";
import { desc } from "~/models/utils/descriptions";
import { getShows, showFilters, showSort } from "./logic";

export const collections = new Elysia({
	prefix: "/collections",
	tags: ["collections"],
})
	.model({
		collection: Collection,
		"collection-translation": CollectionTranslation,
	})
	.use(auth)
	.get(
		"/:id",
		async ({
			params: { id },
			headers: { "accept-language": languages },
			query: { preferOriginal, with: relations },
			jwt: { sub, settings },
			status,
			set,
		}) => {
			const langs = processLanguages(languages);
			const [ret] = await getShows({
				limit: 1,
				filter: and(
					isUuid(id) ? eq(shows.id, id) : eq(shows.slug, id),
					eq(shows.kind, "collection"),
				),
				languages: langs,
				fallbackLanguage: langs.includes("*"),
				preferOriginal: preferOriginal ?? settings.preferOriginal,
				relations,
				userId: sub,
			});
			if (!ret) {
				return status(404, {
					status: 404,
					message: "Collection not found",
				});
			}
			if (!ret.language) {
				return status(422, {
					status: 422,
					message: "Accept-Language header could not be satisfied.",
				});
			}
			set.headers["content-language"] = ret.language;
			return ret;
		},
		{
			detail: {
				description: "Get a collection by id or slug",
			},
			params: t.Object({
				id: t.String({
					description: "The id or slug of the collection to retrieve.",
					example: duneCollection.slug,
				}),
			}),
			query: t.Object({
				preferOriginal: t.Optional(
					t.Boolean({ description: desc.preferOriginal }),
				),
				with: t.Array(t.UnionEnum(["translations"]), {
					default: [],
					description: "Include related resources in the response.",
				}),
			}),
			headers: t.Object(
				{
					"accept-language": AcceptLanguage(),
				},
				{ additionalProperties: true },
			),
			response: {
				200: { ...FullCollection, description: "Found" },
				404: {
					...KError,
					description: "No collection found with the given id or slug.",
				},
				422: KError,
			},
		},
	)
	.get(
		"random",
		async ({ status, redirect }) => {
			const [serie] = await db
				.select({ slug: shows.slug })
				.from(shows)
				.where(eq(shows.kind, "collection"))
				.orderBy(sql`random()`)
				.limit(1);
			if (!serie)
				return status(404, {
					status: 404,
					message: "No collection in the database.",
				});
			return redirect(`${prefix}/collections/${serie.slug}`);
		},
		{
			detail: {
				description: "Get a random collection",
			},
			response: {
				302: t.Void({
					description:
						"Redirected to the [/collections/{id}](#tag/collections/get/api/collections/{id}) route.",
				}),
				404: {
					...KError,
					description: "No collections in the database.",
				},
			},
		},
	)
	.get(
		"",
		async ({
			query: { limit, after, query, sort, filter, preferOriginal },
			headers: { "accept-language": languages },
			jwt: { sub, settings },
			request: { url },
		}) => {
			const langs = processLanguages(languages);
			const items = await getShows({
				limit,
				after,
				query,
				sort,
				filter: and(eq(shows.kind, "collection"), filter),
				languages: langs,
				preferOriginal: preferOriginal ?? settings.preferOriginal,
				userId: sub,
			});
			return createPage(items, { url, sort, limit });
		},
		{
			detail: { description: "Get all collections" },
			query: t.Object({
				sort: showSort,
				filter: t.Optional(Filter({ def: showFilters })),
				query: t.Optional(t.String({ description: desc.query })),
				limit: t.Integer({
					minimum: 1,
					maximum: 250,
					default: 50,
					description: "Max page size.",
				}),
				after: t.Optional(t.String({ description: desc.after })),
				preferOriginal: t.Optional(
					t.Boolean({
						description: desc.preferOriginal,
					}),
				),
			}),
			headers: t.Object(
				{
					"accept-language": AcceptLanguage({ autoFallback: true }),
				},
				{ additionalProperties: true },
			),
			response: {
				200: Page(Collection),
				422: KError,
			},
		},
	)
	.guard({
		params: t.Object({
			id: t.String({
				description: "The id or slug of the collection.",
				example: duneCollection.slug,
			}),
		}),
		query: t.Object({
			sort: showSort,
			filter: t.Optional(Filter({ def: showFilters })),
			query: t.Optional(t.String({ description: desc.query })),
			limit: t.Integer({
				minimum: 1,
				maximum: 250,
				default: 50,
				description: "Max page size.",
			}),
			after: t.Optional(t.String({ description: desc.after })),
			preferOriginal: t.Optional(
				t.Boolean({
					description: desc.preferOriginal,
				}),
			),
		}),
		headers: t.Object(
			{
				"accept-language": AcceptLanguage({ autoFallback: true }),
			},
			{ additionalProperties: true },
		),
	})
	.get(
		"/:id/movies",
		async ({
			params: { id },
			query: { limit, after, query, sort, filter, preferOriginal },
			headers: { "accept-language": languages },
			jwt: { sub, settings },
			request: { url },
			status,
		}) => {
			const [collection] = await db
				.select({ pk: shows.pk })
				.from(shows)
				.where(
					and(
						eq(shows.kind, "collection"),
						isUuid(id) ? eq(shows.id, id) : eq(shows.slug, id),
					),
				)
				.limit(1);

			if (!collection) {
				return status(404, {
					status: 404,
					message: `No collection with the id or slug: '${id}'.`,
				});
			}

			const langs = processLanguages(languages);
			const items = await getShows({
				limit,
				after,
				query,
				sort,
				filter: and(
					eq(shows.collectionPk, collection.pk),
					eq(shows.kind, "movie"),
					filter,
				),
				languages: langs,
				preferOriginal: preferOriginal ?? settings.preferOriginal,
				userId: sub,
			});
			return createPage(items, { url, sort, limit });
		},
		{
			detail: { description: "Get all movies in a collection" },
			response: {
				200: Page(Movie),
				404: {
					...KError,
					description: "No collection found with the given id or slug.",
				},
				422: KError,
			},
		},
	)
	.get(
		"/:id/series",
		async ({
			params: { id },
			query: { limit, after, query, sort, filter, preferOriginal },
			headers: { "accept-language": languages },
			jwt: { sub, settings },
			request: { url },
			status,
		}) => {
			const [collection] = await db
				.select({ pk: shows.pk })
				.from(shows)
				.where(
					and(
						eq(shows.kind, "collection"),
						isUuid(id) ? eq(shows.id, id) : eq(shows.slug, id),
					),
				)
				.limit(1);

			if (!collection) {
				return status(404, {
					status: 404,
					message: `No collection with the id or slug: '${id}'.`,
				});
			}

			const langs = processLanguages(languages);
			const items = await getShows({
				limit,
				after,
				query,
				sort,
				filter: and(
					eq(shows.collectionPk, collection.pk),
					eq(shows.kind, "serie"),
					filter,
				),
				languages: langs,
				preferOriginal: preferOriginal ?? settings.preferOriginal,
				userId: sub,
			});
			return createPage(items, { url, sort, limit });
		},
		{
			detail: { description: "Get all series in a collection" },
			response: {
				200: Page(Serie),
				404: {
					...KError,
					description: "No collection found with the given id or slug.",
				},
				422: KError,
			},
		},
	)
	.get(
		"/:id/shows",
		async ({
			params: { id },
			query: { limit, after, query, sort, filter, preferOriginal },
			headers: { "accept-language": languages },
			jwt: { sub, settings },
			request: { url },
			status,
		}) => {
			const [collection] = await db
				.select({ pk: shows.pk })
				.from(shows)
				.where(
					and(
						eq(shows.kind, "collection"),
						isUuid(id) ? eq(shows.id, id) : eq(shows.slug, id),
					),
				)
				.limit(1);

			if (!collection) {
				return status(404, {
					status: 404,
					message: `No collection with the id or slug: '${id}'.`,
				});
			}

			const langs = processLanguages(languages);
			const items = await getShows({
				limit,
				after,
				query,
				sort,
				filter: and(eq(shows.collectionPk, collection.pk), filter),
				languages: langs,
				preferOriginal: preferOriginal ?? settings.preferOriginal,
				userId: sub,
			});
			return createPage(items, { url, sort, limit });
		},
		{
			detail: { description: "Get all series & movies in a collection" },
			response: {
				200: Page(Show),
				404: {
					...KError,
					description: "No collection found with the given id or slug.",
				},
				422: KError,
			},
		},
	);
