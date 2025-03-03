import { and, eq, exists, sql } from "drizzle-orm";
import Elysia, { t } from "elysia";
import { db } from "~/db";
import {
	showStudioJoin,
	shows,
	studioTranslations,
	studios,
} from "~/db/schema";
import { getColumns, sqlarr } from "~/db/utils";
import { KError } from "~/models/error";
import { Movie } from "~/models/movie";
import { Serie } from "~/models/serie";
import { Show } from "~/models/show";
import { Studio, StudioTranslation } from "~/models/studio";
import {
	AcceptLanguage,
	Filter,
	Page,
	Sort,
	createPage,
	isUuid,
	keysetPaginate,
	processLanguages,
	sortToSql,
} from "~/models/utils";
import { desc } from "~/models/utils/descriptions";
import { getShows, showFilters, showSort } from "./shows/logic";

const studioSort = Sort(["slug", "createdAt"], { default: ["slug"] });

export const studiosH = new Elysia({ prefix: "/studios", tags: ["studios"] })
	.model({
		studio: Studio,
		"studio-translation": StudioTranslation,
	})
	.get(
		"/:id",
		async ({
			params: { id },
			headers: { "accept-language": languages },
			query: { with: relations },
			error,
			set,
		}) => {
			const langs = processLanguages(languages);
			const ret = await db.query.studios.findFirst({
				where: isUuid(id) ? eq(studios.id, id) : eq(studios.slug, id),
				with: {
					selectedTranslation: {
						columns: { pk: false },
						where: !languages.includes("*")
							? eq(studioTranslations.language, sql`any(${sqlarr(langs)})`)
							: undefined,
						orderBy: [
							sql`array_position(${sqlarr(langs)}, ${studioTranslations.language})`,
						],
						limit: 1,
					},
					...(relations.includes("translations") && {
						translations: {
							columns: {
								pk: false,
							},
						},
					}),
				},
			});
			if (!ret) {
				return error(404, {
					status: 404,
					message: `No studio with the id or slug: '${id}'`,
				});
			}
			const tr = ret.selectedTranslation[0];
			set.headers["content-language"] = tr.language;
			return {
				...ret,
				...tr,
				...(ret.translations && {
					translations: Object.fromEntries(
						ret.translations.map(
							({ language, ...translation }) =>
								[language, translation] as const,
						),
					),
				}),
			};
		},
		{
			detail: {
				description: "Get a studio by id or slug",
			},
			params: t.Object({
				id: t.String({
					description: "The id or slug of the collection to retrieve.",
					example: "mappa",
				}),
			}),
			query: t.Object({
				with: t.Array(t.UnionEnum(["translations"]), {
					default: [],
					description: "Include related resources in the response.",
				}),
			}),
			headers: t.Object({
				"accept-language": AcceptLanguage(),
			}),
			response: {
				200: { ...Studio, description: "Found" },
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
		async ({ error, redirect }) => {
			const [studio] = await db
				.select({ slug: studios.slug })
				.from(studios)
				.orderBy(sql`random()`)
				.limit(1);
			if (!studio)
				return error(404, {
					status: 404,
					message: "No studios in the database.",
				});
			return redirect(`/studios/${studio.slug}`);
		},
		{
			detail: {
				description: "Get a random studio.",
			},
			response: {
				302: t.Void({
					description:
						"Redirected to the [/studios/{id}](#tag/studios/GET/studios/{id}) route.",
				}),
				404: {
					...KError,
					description: "No studios in the database.",
				},
			},
		},
	)
	.get(
		"",
		async ({
			query: { limit, after, query, sort, filter },
			headers: { "accept-language": languages },
			request: { url },
		}) => {
			const langs = processLanguages(languages);
			const transQ = db
				.selectDistinctOn([studioTranslations.pk])
				.from(studioTranslations)
				.orderBy(
					studioTranslations.pk,
					sql`array_position(${sqlarr(langs)}, ${studioTranslations.language}`,
				)
				.as("t");
			const { pk, ...transCol } = getColumns(transQ);

			const items = await db
				.select({
					...getColumns(studios),
					...transCol,
				})
				.from(studios)
				.where(
					and(
						query ? sql`${transQ.name} %> ${query}::text` : undefined,
						keysetPaginate({ table: studios, after, sort }),
					),
				)
				.orderBy(
					...(query
						? [sql`word_similarity(${query}::text, ${transQ.name})`]
						: sortToSql(sort, studios)),
					studios.pk,
				)
				.limit(limit);
			return createPage(items, { url, sort, limit });
		},
		{
			detail: { description: "Get all studios" },
			query: t.Object({
				sort: studioSort,
				query: t.Optional(t.String({ description: desc.query })),
				limit: t.Integer({
					minimum: 1,
					maximum: 250,
					default: 50,
					description: "Max page size.",
				}),
				after: t.Optional(t.String({ description: desc.after })),
			}),
			headers: t.Object({
				"accept-language": AcceptLanguage({ autoFallback: true }),
			}),
			response: {
				200: Page(Studio),
				422: KError,
			},
		},
	)
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
		"/:id/shows",
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
	)
	.get(
		"/:id/movies",
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
					eq(shows.kind, "movie"),
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
			detail: { description: "Get all movies made by a studio." },
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
					eq(shows.kind, "serie"),
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
			detail: { description: "Get all series made by a studio." },
			response: {
				200: Page(Serie),
				404: {
					...KError,
					description: "No collection found with the given id or slug.",
				},
				422: KError,
			},
		},
	);
