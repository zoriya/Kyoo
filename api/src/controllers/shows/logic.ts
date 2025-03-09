import type { StaticDecode } from "@sinclair/typebox";
import { type SQL, and, eq, exists, sql } from "drizzle-orm";
import { db } from "~/db";
import {
	showStudioJoin,
	showTranslations,
	shows,
	studioTranslations,
	studios,
} from "~/db/schema";
import {
	coalesce,
	getColumns,
	jsonbAgg,
	jsonbBuildObject,
	jsonbObjectAgg,
	sqlarr,
} from "~/db/utils";
import type { MovieStatus } from "~/models/movie";
import { SerieStatus, SerieTranslation } from "~/models/serie";
import { Studio } from "~/models/studio";
import {
	type FilterDef,
	Genre,
	type Image,
	Sort,
	isUuid,
	keysetPaginate,
	selectTranslationQuery,
	sortToSql,
} from "~/models/utils";

export const showFilters: FilterDef = {
	genres: {
		column: shows.genres,
		type: "enum",
		values: Genre.enum,
		isArray: true,
	},
	rating: { column: shows.rating, type: "int" },
	status: { column: shows.status, type: "enum", values: SerieStatus.enum },
	runtime: { column: shows.runtime, type: "float" },
	airDate: { column: shows.startAir, type: "date" },
	startAir: { column: shows.startAir, type: "date" },
	endAir: { column: shows.startAir, type: "date" },
	originalLanguage: {
		column: sql`${shows.original}->'language'`,
		type: "string",
	},
	tags: {
		column: sql.raw(`t.${showTranslations.tags.name}`),
		type: "string",
		isArray: true,
	},
};
export const showSort = Sort(
	[
		"slug",
		"rating",
		"airDate",
		"startAir",
		"endAir",
		"createdAt",
		"nextRefresh",
	],
	{
		remap: { airDate: "startAir" },
		default: ["slug"],
	},
);

const buildRelations = <R extends string>(
	relations: R[],
	toSql: (relation: R) => SQL,
) => {
	return Object.fromEntries(relations.map((x) => [x, toSql(x)])) as Record<
		R,
		SQL
	>;
};

export async function getShows({
	after,
	limit,
	query,
	sort,
	filter,
	languages,
	fallbackLanguage = true,
	preferOriginal = false,
	relations = [],
}: {
	after?: string;
	limit: number;
	query?: string;
	sort?: StaticDecode<typeof showSort>;
	filter?: SQL;
	languages: string[];
	fallbackLanguage?: boolean;
	preferOriginal?: boolean;
	relations?: ("translations" | "studios" | "videos")[];
}) {
	const transQ = db
		.selectDistinctOn([showTranslations.pk])
		.from(showTranslations)
		.where(
			!fallbackLanguage
				? eq(showTranslations.language, sql`any(${sqlarr(languages)})`)
				: undefined,
		)
		.orderBy(
			showTranslations.pk,
			sql`array_position(${sqlarr(languages)}, ${showTranslations.language})`,
		)
		.as("t");
	const { pk, ...transCol } = getColumns(transQ);

	const relationsSql = buildRelations(relations, (x) => {
		switch (x) {
			case "videos":
			case "translations": {
				// we wrap that in a sql`` instead of using the builder because of this issue
				// https://github.com/drizzle-team/drizzle-orm/pull/1674
				const { pk, language, ...trans } = getColumns(showTranslations);
				return sql<SerieTranslation[]>`${db
					.select({ json: jsonbObjectAgg(language, jsonbBuildObject(trans)) })
					.from(showTranslations)
					.where(eq(showTranslations.pk, shows.pk))}`;
			}
			case "studios": {
				const { pk: _, ...studioCol } = getColumns(studios);
				const studioTransQ = db
					.selectDistinctOn([studioTranslations.pk])
					.from(studioTranslations)
					.where(
						!fallbackLanguage
							? eq(showTranslations.language, sql`any(${sqlarr(languages)})`)
							: undefined,
					)
					.orderBy(
						studioTranslations.pk,
						sql`array_position(${sqlarr(languages)}, ${studioTranslations.language}`,
					)
					.as("t");
				const { pk, language, ...studioTrans } = getColumns(studioTransQ);

				return sql<Studio>`${db
					.select({
						json: coalesce(
							jsonbAgg(jsonbBuildObject({ ...studioTrans, ...studioCol })),
							sql`'[]'::jsonb`,
						),
					})
					.from(studios)
					.leftJoin(studioTransQ, eq(studios.pk, studioTransQ.pk))
					.where(
						exists(
							db
								.select()
								.from(showStudioJoin)
								.where(
									and(
										eq(showStudioJoin.studioPk, studios.pk),
										eq(showStudioJoin.showPk, shows.pk),
									),
								),
						),
					)}`;
			}
		}
	});

	return await db
		.select({
			...getColumns(shows),
			...transCol,
			lanugage: transQ.language,

			// movie columns (status is only a typescript hint)
			status: sql<MovieStatus>`${shows.status}`,
			airDate: shows.startAir,
			kind: sql<any>`${shows.kind}`,
			isAvailable: sql<boolean>`${shows.availableCount} != 0`,

			...(preferOriginal && {
				poster: sql<Image>`coalesce(nullif(${shows.original}->'poster', 'null'::jsonb), ${transQ.poster})`,
				thumbnail: sql<Image>`coalesce(nullif(${shows.original}->'thumbnail', 'null'::jsonb), ${transQ.thumbnail})`,
				banner: sql<Image>`coalesce(nullif(${shows.original}->'banner', 'null'::jsonb), ${transQ.banner})`,
				logo: sql<Image>`coalesce(nullif(${shows.original}->'logo', 'null'::jsonb), ${transQ.logo})`,
			}),

			...relationsSql,
		})
		.from(shows)
		[fallbackLanguage ? "innerJoin" : "leftJoin"](
			transQ,
			eq(shows.pk, transQ.pk),
		)
		.where(
			and(
				filter,
				query ? sql`${transQ.name} %> ${query}::text` : undefined,
				keysetPaginate({ table: shows, after, sort }),
			),
		)
		.orderBy(
			...(query
				? [sql`word_similarity(${query}::text, ${transQ.name})`]
				: sortToSql(sort, shows)),
			shows.pk,
		)
		.limit(limit);
}
