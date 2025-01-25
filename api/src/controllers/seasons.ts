import { and, eq, sql } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "~/db";
import { seasonTranslations, seasons, shows } from "~/db/schema";
import { getColumns, sqlarr } from "~/db/utils";
import { KError } from "~/models/error";
import { madeInAbyss } from "~/models/examples";
import {
	AcceptLanguage,
	Filter,
	type FilterDef,
	Page,
	Sort,
	createPage,
	isUuid,
	keysetPaginate,
	processLanguages,
	sortToSql,
} from "~/models/utils";
import { desc } from "~/models/utils/descriptions";
import { Season, SeasonTranslation } from "../models/season";

const seasonFilters: FilterDef = {
	seasonNumber: { column: seasons.seasonNumber, type: "int" },
	startAir: { column: seasons.startAir, type: "date" },
	endAir: { column: seasons.endAir, type: "date" },
};

export const seasonsH = new Elysia({ tags: ["series"] })
	.model({
		season: Season,
		"season-translation": SeasonTranslation,
	})
	.get(
		"/series/:id/seasons",
		async ({
			params: { id },
			query: { limit, after, query, sort, filter },
			headers: { "accept-language": languages },
			request: { url },
		}) => {
			const langs = processLanguages(languages);

			const show = db.$with("serie").as(
				db
					.select({ pk: shows.pk })
					.from(shows)
					.where(
						and(
							eq(shows.kind, "serie"),
							isUuid(id) ? eq(shows.id, id) : eq(shows.slug, id),
						),
					)
					.limit(1),
			);

			const transQ = db
				.selectDistinctOn([seasonTranslations.pk])
				.from(seasonTranslations)
				.orderBy(
					seasonTranslations.pk,
					sql`array_position(${sqlarr(langs)}, ${seasonTranslations.language})`,
				)
				.as("t");
			const { pk, ...transCol } = getColumns(transQ);

			const items = await db
				.with(show)
				.select({
					...getColumns(seasons),
					...transCol,
				})
				.from(seasons)
				.innerJoin(transQ, eq(seasons.pk, transQ.pk))
				.where(
					and(
						eq(seasons.showPk, show.pk),
						filter,
						query ? sql`${transQ.name} %> ${query}::text` : undefined,
						keysetPaginate({ table: seasons, after, sort }),
					),
				)
				.orderBy(
					...(query
						? [sql`word_similarity(${query}::text, ${transQ.name})`]
						: sortToSql(sort, seasons)),
					seasons.pk,
				)
				.limit(limit);

			return createPage(items, { url, sort, limit });
		},
		{
			detail: { description: "Get seasons of a serie" },
			path: t.Object({
				id: t.String({
					description: "The id or slug of the serie.",
					examples: [madeInAbyss.slug],
				}),
			}),
			query: t.Object({
				sort: Sort(["seasonNumber", "startAir", "endAir", "nextRefresh"], {
					default: ["seasonNumber"],
				}),
				filter: t.Optional(Filter({ def: seasonFilters })),
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
				200: Page(Season),
				422: KError,
			},
		},
	);
