import { and, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { shows } from "~/db/schema";
import { KError } from "~/models/error";
import { Serie, SerieTranslation } from "~/models/serie";
import {
	AcceptLanguage,
	Filter,
	Page,
	createPage,
	processLanguages,
} from "~/models/utils";
import { desc } from "~/models/utils/descriptions";
import { getShows, showFilters, showSort } from "./shows";

export const series = new Elysia({ prefix: "/series", tags: ["series"] })
	.model({
		serie: Serie,
		"serie-translation": SerieTranslation,
	})
	.get(
		"",
		async ({
			query: { limit, after, query, sort, filter, preferOriginal },
			headers: { "accept-language": languages },
			request: { url },
		}) => {
			const langs = processLanguages(languages);
			const items = await getShows({
				limit,
				after,
				query,
				sort,
				filter: and(eq(shows.kind, "serie"), filter),
				languages: langs,
				preferOriginal,
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
			headers: t.Object({
				"accept-language": AcceptLanguage({ autoFallback: true }),
			}),
			response: {
				200: Page(Serie),
				422: KError,
			},
		},
	);
