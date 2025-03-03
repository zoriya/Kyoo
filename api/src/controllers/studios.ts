import { and, eq, exists } from "drizzle-orm";
import Elysia, { t } from "elysia";
import { db } from "~/db";
import { showStudioJoin, shows, studios } from "~/db/schema";
import { KError } from "~/models/error";
import { Show } from "~/models/show";
import { Studio, StudioTranslation } from "~/models/studio";
import {
	AcceptLanguage,
	Filter,
	Page,
	createPage,
	isUuid,
	processLanguages,
} from "~/models/utils";
import { desc } from "~/models/utils/descriptions";
import { getShows, showFilters, showSort } from "./shows/logic";

export const studiosH = new Elysia({ tags: ["studios"] })
	.model({
		studio: Studio,
		"studio-translation": StudioTranslation,
	})
	.guard({
		params: t.Object({
			id: t.String({
				description: "The id or slug of the studio.",
				example: "mappa",
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
		headers: t.Object({
			"accept-language": AcceptLanguage({ autoFallback: true }),
		}),
	})
	.get(
		"/studios/:id/shows",
		async ({
			params: { id },
			query: { limit, after, query, sort, filter, preferOriginal },
			headers: { "accept-language": languages },
			request: { url },
			error,
		}) => {
			const [studio] = await db
				.select({ pk: studios.pk })
				.from(studios)
				.where(isUuid(id) ? eq(studios.id, id) : eq(studios.slug, id))
				.limit(1);

			if (!studio) {
				return error(404, {
					status: 404,
					message: `No studios with the id or slug: '${id}'.`,
				});
			}

			const langs = processLanguages(languages);
			const items = await getShows({
				limit,
				after,
				query,
				sort,
				filter: and(
					exists(
						db
							.select()
							.from(showStudioJoin)
							.where(
								and(
									eq(showStudioJoin.studio, studio.pk),
									eq(showStudioJoin.show, shows.pk),
								),
							),
					),
					filter,
				),
				languages: langs,
				preferOriginal,
			});
			return createPage(items, { url, sort, limit });
		},
		{
			detail: { description: "Get all series & movies made by a studio." },
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
