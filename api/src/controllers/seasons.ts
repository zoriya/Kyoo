import { and, eq, sql } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "~/db";
import { seasons, seasonTranslations, shows } from "~/db/schema";
import { getColumns, sqlarr } from "~/db/utils";
import { KError } from "~/models/error";
import { madeInAbyss } from "~/models/examples";
import {
	AcceptLanguage,
	createPage,
	Filter,
	type FilterDef,
	isUuid,
	keysetPaginate,
	Page,
	processLanguages,
	Sort,
	sortToSql,
} from "~/models/utils";
import { desc } from "~/models/utils/descriptions";
import { Season, SeasonTranslation } from "../models/season";

const seasonFilters: FilterDef = {
	seasonNumber: { column: seasons.seasonNumber, type: "int" },
	startAir: { column: seasons.startAir, type: "date" },
	endAir: { column: seasons.endAir, type: "date" },
	entriesCount: { column: seasons.entriesCount, type: "int" },
	availableCount: { column: seasons.availableCount, type: "int" },
};

const seasonSort = Sort(
	{
		seasonNumber: seasons.seasonNumber,
		startAir: seasons.startAir,
		endAir: seasons.endAir,
		entriesCount: seasons.entriesCount,
		availableCount: seasons.availableCount,
		nextRefresh: seasons.nextRefresh,
	},
	{
		default: ["seasonNumber"],
		tablePk: seasons.pk,
	},
);

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
			status,
		}) => {
			const langs = processLanguages(languages);

			const [serie] = await db
				.select({ pk: shows.pk })
				.from(shows)
				.where(
					and(
						eq(shows.kind, "serie"),
						isUuid(id) ? eq(shows.id, id) : eq(shows.slug, id),
					),
				)
				.limit(1);

			if (!serie) {
				return status(404, {
					status: 404,
					message: `No serie with the id or slug: '${id}'.`,
				});
			}

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
				.select({
					...getColumns(seasons),
					...transCol,
				})
				.from(seasons)
				.innerJoin(transQ, eq(seasons.pk, transQ.pk))
				.where(
					and(
						eq(seasons.showPk, serie.pk),
						filter,
						query ? sql`${transQ.name} %> ${query}::text` : undefined,
						keysetPaginate({ after, sort }),
					),
				)
				.orderBy(
					...(query
						? [sql`word_similarity(${query}::text, ${transQ.name})`]
						: sortToSql(sort)),
					seasons.pk,
				)
				.limit(limit);

			return createPage(items, { url, sort, limit });
		},
		{
			detail: { description: "Get seasons of a serie" },
			params: t.Object({
				id: t.String({
					description: "The id or slug of the serie.",
					example: madeInAbyss.slug,
				}),
			}),
			query: t.Object({
				sort: seasonSort,
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
			headers: t.Object(
				{
					"accept-language": AcceptLanguage({ autoFallback: true }),
				},
				{ additionalProperties: true },
			),
			response: {
				200: Page(Season),
				404: {
					...KError,
					description: "No serie found with the given id or slug.",
				},
				422: KError,
			},
		},
	);
