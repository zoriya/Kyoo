import type { StaticDecode } from "@sinclair/typebox";
import { type SQL, and, eq, sql } from "drizzle-orm";
import { db } from "~/db";
import { showTranslations, shows, studioTranslations } from "~/db/schema";
import { getColumns, sqlarr } from "~/db/utils";
import type { MovieStatus } from "~/models/movie";
import { SerieStatus } from "~/models/serie";
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
	originalLanguage: { column: shows.originalLanguage, type: "string" },
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

export async function getShows({
	after,
	limit,
	query,
	sort,
	filter,
	languages,
	preferOriginal,
}: {
	after: string | undefined;
	limit: number;
	query: string | undefined;
	sort: StaticDecode<typeof showSort>;
	filter: SQL | undefined;
	languages: string[];
	preferOriginal: boolean | undefined;
}) {
	const transQ = db
		.selectDistinctOn([showTranslations.pk])
		.from(showTranslations)
		.orderBy(
			showTranslations.pk,
			sql`array_position(${sqlarr(languages)}, ${showTranslations.language})`,
		)
		.as("t");
	const { pk, poster, thumbnail, banner, logo, ...transCol } =
		getColumns(transQ);

	return await db
		.select({
			...getColumns(shows),
			...transCol,
			// movie columns (status is only a typescript hint)
			status: sql<MovieStatus>`${shows.status}`,
			airDate: shows.startAir,
			kind: sql<any>`${shows.kind}`,
			isAvailable: sql<boolean>`${shows.availableCount} != 0`,

			poster: sql<Image>`coalesce(${showTranslations.poster}, ${poster})`,
			thumbnail: sql<Image>`coalesce(${showTranslations.thumbnail}, ${thumbnail})`,
			banner: sql<Image>`coalesce(${showTranslations.banner}, ${banner})`,
			logo: sql<Image>`coalesce(${showTranslations.logo}, ${logo})`,
		})
		.from(shows)
		.innerJoin(transQ, eq(shows.pk, transQ.pk))
		.leftJoin(
			showTranslations,
			and(
				sql`${preferOriginal ?? false}`,
				eq(shows.pk, showTranslations.pk),
				eq(showTranslations.language, shows.originalLanguage),
			),
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

export async function getShow(
	id: string,
	{
		languages,
		preferOriginal,
		relations,
		filters,
	}: {
		languages: string[];
		preferOriginal: boolean | undefined;
		relations: ("translations" | "studios" | "videos")[];
		filters: SQL | undefined;
	},
) {
	const ret = await db.query.shows.findFirst({
		extras: {
			airDate: sql<string>`${shows.startAir}`.as("airDate"),
			status: sql<MovieStatus>`${shows.status}`.as("status"),
			isAvailable: sql<boolean>`${shows.availableCount} != 0`.as("isAvailable"),
		},
		where: and(isUuid(id) ? eq(shows.id, id) : eq(shows.slug, id), filters),
		with: {
			selectedTranslation: selectTranslationQuery(showTranslations, languages),
			...(preferOriginal && {
				originalTranslation: {
					columns: {
						poster: true,
						thumbnail: true,
						banner: true,
						logo: true,
					},
				},
			}),
			...(relations.includes("translations") && {
				translations: {
					columns: {
						pk: false,
					},
				},
			}),
			...(relations.includes("studios") && {
				studios: {
					with: {
						studio: {
							columns: {
								pk: false,
							},
							with: {
								selectedTranslation: selectTranslationQuery(
									studioTranslations,
									languages,
								),
							},
						},
					},
				},
			}),
		},
	});
	if (!ret) return null;
	const translation = ret.selectedTranslation[0];
	if (!translation) return { show: null, language: null };
	const ot = ret.originalTranslation;
	const show = {
		...ret,
		...translation,
		kind: ret.kind as any,
		...(ot && {
			...(ot.poster && { poster: ot.poster }),
			...(ot.thumbnail && { thumbnail: ot.thumbnail }),
			...(ot.banner && { banner: ot.banner }),
			...(ot.logo && { logo: ot.logo }),
		}),
		...(ret.translations && {
			translations: Object.fromEntries(
				ret.translations.map(
					({ language, ...translation }) => [language, translation] as const,
				),
			),
		}),
		...(ret.studios && {
			studios: ret.studios.map((x: any) => ({
				...x.studio,
				...x.studio.selectedTranslation[0],
			})),
		}),
	};
	return { show, language: translation.language };
}
