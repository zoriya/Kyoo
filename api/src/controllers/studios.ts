import { and, eq, exists, type SQL, sql } from "drizzle-orm";
import Elysia, { t } from "elysia";
import { auth } from "~/auth";
import { prefix } from "~/base";
import { db } from "~/db";
import {
	showStudioJoin,
	shows,
	studios,
	studioTranslations,
} from "~/db/schema";
import {
	getColumns,
	jsonbBuildObject,
	jsonbObjectAgg,
	sqlarr,
} from "~/db/utils";
import { KError } from "~/models/error";
import { Movie } from "~/models/movie";
import { Serie } from "~/models/serie";
import { Show } from "~/models/show";
import { Studio, StudioTranslation } from "~/models/studio";
import {
	AcceptLanguage,
	buildRelations,
	createPage,
	Filter,
	isUuid,
	keysetPaginate,
	Page,
	processLanguages,
	Sort,
	sortToSql,
} from "~/models/utils";
import { desc } from "~/models/utils/descriptions";
import { getShows, showFilters, showSort } from "./shows/logic";

const studioSort = Sort(
	{
		slug: studios.slug,
		createdAt: studios.createdAt,
	},
	{
		default: ["slug"],
		tablePk: studios.pk,
	},
);

const studioRelations = {
	translations: () => {
		const { pk, language, ...trans } = getColumns(studioTranslations);
		return db
			.select({
				json: jsonbObjectAgg(
					language,
					jsonbBuildObject<StudioTranslation>(trans),
				).as("json"),
			})
			.from(studioTranslations)
			.where(eq(studioTranslations.pk, shows.pk))
			.as("translations");
	},
};

export async function getStudios({
	after,
	limit,
	query,
	sort,
	filter,
	languages,
	fallbackLanguage = true,
	relations = [],
}: {
	after?: string;
	limit: number;
	query?: string;
	sort?: Sort;
	filter?: SQL;
	languages: string[];
	fallbackLanguage?: boolean;
	preferOriginal?: boolean;
	relations?: (keyof typeof studioRelations)[];
}) {
	const transQ = db
		.selectDistinctOn([studioTranslations.pk])
		.from(studioTranslations)
		.where(
			!fallbackLanguage
				? eq(studioTranslations.language, sql`any(${sqlarr(languages)})`)
				: undefined,
		)
		.orderBy(
			studioTranslations.pk,
			sql`array_position(${sqlarr(languages)}, ${studioTranslations.language})`,
		)
		.as("t");

	return await db
		.select({
			...getColumns(studios),
			...getColumns(transQ),
			...buildRelations(relations, studioRelations),
		})
		.from(studios)
		[fallbackLanguage ? "innerJoin" : ("leftJoin" as "innerJoin")](
			transQ,
			eq(studios.pk, transQ.pk),
		)
		.where(
			and(
				filter,
				query ? sql`${transQ.name} %> ${query}::text` : undefined,
				keysetPaginate({ after, sort }),
			),
		)
		.orderBy(
			...(query
				? [sql`word_similarity(${query}::text, ${transQ.name})`]
				: sortToSql(sort)),
			studios.pk,
		)
		.limit(limit);
}

export const studiosH = new Elysia({ prefix: "/studios", tags: ["studios"] })
	.model({
		studio: Studio,
		"studio-translation": StudioTranslation,
	})
	.use(auth)
	.get(
		"/:id",
		async ({
			params: { id },
			headers: { "accept-language": languages },
			query: { with: relations },
			status,
			set,
		}) => {
			const langs = processLanguages(languages);
			const [ret] = await getStudios({
				limit: 1,
				filter: isUuid(id) ? eq(studios.id, id) : eq(studios.slug, id),
				languages: langs,
				fallbackLanguage: langs.includes("*"),
				relations,
			});
			if (!ret) {
				return status(404, {
					status: 404,
					message: `No studio found with the id or slug: '${id}'`,
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
				description: "Get a studio by id or slug",
			},
			params: t.Object({
				id: t.String({
					description: "The id or slug of the studio to retrieve.",
					example: "mappa",
				}),
			}),
			query: t.Object({
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
				200: "studio",
				404: {
					...KError,
					description: "No studio found with the given id or slug.",
				},
				422: KError,
			},
		},
	)
	.get(
		"random",
		async ({ status, redirect }) => {
			const [studio] = await db
				.select({ slug: studios.slug })
				.from(studios)
				.orderBy(sql`random()`)
				.limit(1);
			if (!studio)
				return status(404, {
					status: 404,
					message: "No studios in the database.",
				});
			return redirect(`${prefix}/studios/${studio.slug}`);
		},
		{
			detail: {
				description: "Get a random studio.",
			},
			response: {
				302: t.Void({
					description:
						"Redirected to the [/studios/{id}](#tag/studios/get/api/studios/{id}) route.",
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
			query: { limit, after, query, sort },
			headers: { "accept-language": languages },
			request: { url },
		}) => {
			const langs = processLanguages(languages);
			const items = await getStudios({
				limit,
				after,
				query,
				sort,
				languages: langs,
			});
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
			headers: t.Object(
				{
					"accept-language": AcceptLanguage({ autoFallback: true }),
				},
				{ additionalProperties: true },
			),
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
		headers: t.Object(
			{
				"accept-language": AcceptLanguage({ autoFallback: true }),
			},
			{ additionalProperties: true },
		),
	})
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
			const [studio] = await db
				.select({ pk: studios.pk })
				.from(studios)
				.where(isUuid(id) ? eq(studios.id, id) : eq(studios.slug, id))
				.limit(1);

			if (!studio) {
				return status(404, {
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
									eq(showStudioJoin.studioPk, studio.pk),
									eq(showStudioJoin.showPk, shows.pk),
								),
							),
					),
					filter,
				),
				languages: langs,
				preferOriginal: preferOriginal ?? settings.preferOriginal,
				userId: sub,
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
			jwt: { sub, settings },
			request: { url },
			status,
		}) => {
			const [studio] = await db
				.select({ pk: studios.pk })
				.from(studios)
				.where(isUuid(id) ? eq(studios.id, id) : eq(studios.slug, id))
				.limit(1);

			if (!studio) {
				return status(404, {
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
									eq(showStudioJoin.studioPk, studio.pk),
									eq(showStudioJoin.showPk, shows.pk),
								),
							),
					),
					filter,
				),
				languages: langs,
				preferOriginal: preferOriginal ?? settings.preferOriginal,
				userId: sub,
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
			jwt: { sub, settings },
			request: { url },
			status,
		}) => {
			const [studio] = await db
				.select({ pk: studios.pk })
				.from(studios)
				.where(isUuid(id) ? eq(studios.id, id) : eq(studios.slug, id))
				.limit(1);

			if (!studio) {
				return status(404, {
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
									eq(showStudioJoin.studioPk, studio.pk),
									eq(showStudioJoin.showPk, shows.pk),
								),
							),
					),
					filter,
				),
				languages: langs,
				preferOriginal: preferOriginal ?? settings.preferOriginal,
				userId: sub,
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
