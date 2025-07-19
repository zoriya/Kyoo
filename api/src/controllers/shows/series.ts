import { and, eq, sql } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { auth } from "~/auth";
import { prefix } from "~/base";
import { db } from "~/db";
import { shows } from "~/db/schema";
import { KError } from "~/models/error";
import { madeInAbyss } from "~/models/examples";
import { FullSerie, Serie, SerieTranslation } from "~/models/serie";
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

export const series = new Elysia({ prefix: "/series", tags: ["series"] })
	.model({
		serie: Serie,
		"serie-translation": SerieTranslation,
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
					eq(shows.kind, "serie"),
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
					message: `No serie found with the id or slug: '${id}'.`,
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
				description: "Get a serie by id or slug",
			},
			params: t.Object({
				id: t.String({
					description: "The id or slug of the serie to retrieve.",
					example: madeInAbyss.slug,
				}),
			}),
			query: t.Object({
				preferOriginal: t.Optional(
					t.Boolean({ description: desc.preferOriginal }),
				),
				with: t.Array(
					t.UnionEnum(["translations", "studios", "firstEntry", "nextEntry"]),
					{
						default: [],
						description: "Include related resources in the response.",
					},
				),
			}),
			headers: t.Object(
				{
					"accept-language": AcceptLanguage(),
				},
				{ additionalProperties: true },
			),
			response: {
				200: { ...FullSerie, description: "Found" },
				404: {
					...KError,
					description: "No movie found with the given id or slug.",
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
				.where(eq(shows.kind, "serie"))
				.orderBy(sql`random()`)
				.limit(1);
			if (!serie)
				return status(404, {
					status: 404,
					message: "No series in the database.",
				});
			return redirect(`${prefix}/series/${serie.slug}`);
		},
		{
			detail: {
				description: "Get a random serie",
			},
			response: {
				302: t.Void({
					description:
						"Redirected to the [/series/{id}](#tag/series/get/api/series/{id}) route.",
				}),
				404: {
					...KError,
					description: "No series in the database.",
				},
			},
		},
	)
	.get(
		"",
		async ({
			query: { limit, after, query, sort, filter, preferOriginal },
			headers: { "accept-language": languages },
			request: { url },
			jwt: { sub, settings },
		}) => {
			const langs = processLanguages(languages);
			const items = await getShows({
				limit,
				after,
				query,
				sort,
				filter: and(eq(shows.kind, "serie"), filter),
				languages: langs,
				preferOriginal: preferOriginal ?? settings.preferOriginal,
				userId: sub,
			});
			return createPage(items, { url, sort, limit });
		},
		{
			detail: { description: "Get all series" },
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
				200: Page(Serie),
				422: KError,
			},
		},
	);
