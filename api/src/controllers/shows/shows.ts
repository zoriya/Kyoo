import { and, isNull, sql } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "~/db";
import { shows } from "~/db/schema";
import { Collection } from "~/models/collections";
import { KError } from "~/models/error";
import { Movie } from "~/models/movie";
import { Serie } from "~/models/serie";
import {
	AcceptLanguage,
	Filter,
	Page,
	createPage,
	processLanguages,
} from "~/models/utils";
import { desc } from "~/models/utils/descriptions";
import { getShows, showFilters, showSort } from "./logic";

const Show = t.Union([Movie, Serie, Collection]);

export const showsH = new Elysia({ prefix: "/shows", tags: ["shows"] })
	.model({
		show: Show,
	})
	.get(
		"random",
		async ({ error, redirect }) => {
			const [show] = await db
				.select({ kind: shows.kind, slug: shows.slug })
				.from(shows)
				.orderBy(sql`random()`)
				.limit(1);
			if (!show)
				return error(404, {
					status: 404,
					message: "No shows in the database.",
				});
			return redirect(`/${show.kind}s/${show.slug}`);
		},
		{
			detail: {
				description: "Get a random movie/serie/collection",
			},
			response: {
				302: t.Void({
					description: "Redirected to the appropriate get endpoint.",
				}),
				404: {
					...KError,
					description: "No show in the database.",
				},
			},
		},
	)
	.get(
		"",
		async ({
			query: {
				limit,
				after,
				query,
				sort,
				filter,
				preferOriginal,
				ignoreInCollection,
			},
			headers: { "accept-language": languages },
			request: { url },
		}) => {
			const langs = processLanguages(languages);
			const items = await getShows({
				limit,
				after,
				query,
				sort,
				filter: and(
					ignoreInCollection ? isNull(shows.collectionPk) : undefined,
					filter,
				),
				languages: langs,
				preferOriginal,
			});
			return createPage(items, { url, sort, limit });
		},
		{
			detail: { description: "Get all movies/series/collections" },
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
				ignoreInCollection: t.Optional(
					t.Boolean({
						description:
							"If a movie or serie is part of collection, don't return it.",
						default: true,
					}),
				),
			}),
			headers: t.Object({
				"accept-language": AcceptLanguage({ autoFallback: true }),
			}),
			response: {
				200: Page(Show),
				422: KError,
			},
		},
	);
