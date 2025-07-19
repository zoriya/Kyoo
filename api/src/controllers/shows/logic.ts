import { and, eq, exists, ne, type SQL, sql } from "drizzle-orm";
import { db } from "~/db";
import {
	entries,
	entryVideoJoin,
	profiles,
	showStudioJoin,
	shows,
	showTranslations,
	studios,
	studioTranslations,
	videos,
} from "~/db/schema";
import { watchlist } from "~/db/schema/watchlist";
import {
	coalesce,
	getColumns,
	jsonbAgg,
	jsonbBuildObject,
	jsonbObjectAgg,
	sqlarr,
} from "~/db/utils";
import type { Entry } from "~/models/entry";
import type { MovieStatus } from "~/models/movie";
import { SerieStatus, type SerieTranslation } from "~/models/serie";
import type { Studio } from "~/models/studio";
import {
	buildRelations,
	type FilterDef,
	Genre,
	type Image,
	keysetPaginate,
	Sort,
	sortToSql,
} from "~/models/utils";
import type { EmbeddedVideo } from "~/models/video";
import { WatchlistStatus } from "~/models/watchlist";
import {
	entryProgressQ,
	entryVideosQ,
	getEntryTransQ,
	mapProgress,
} from "../entries";

export const watchStatusQ = db
	.select({
		...getColumns(watchlist),
		percent: sql<number>`${watchlist.seenCount}`.as("percent"),
	})
	.from(watchlist)
	.leftJoin(profiles, eq(watchlist.profilePk, profiles.pk))
	.where(eq(profiles.id, sql.placeholder("userId")))
	.as("watchstatus");

export const showFilters: FilterDef = {
	kind: {
		column: shows.kind,
		type: "enum",
		values: ["serie", "movie", "collection"],
	},
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
	endAir: { column: shows.endAir, type: "date" },
	originalLanguage: {
		column: sql`${shows.original}->'language'`,
		type: "string",
	},
	tags: {
		column: sql.raw(`t.${showTranslations.tags.name}`),
		type: "string",
		isArray: true,
	},
	watchStatus: {
		column: watchStatusQ.status,
		type: "enum",
		values: WatchlistStatus.enum,
	},
	score: { column: watchStatusQ.score, type: "int" },
	isAvailable: { column: sql`(${shows.availableCount} > 0)`, type: "bool" },
};
export const showSort = Sort(
	{
		slug: shows.slug,
		name: {
			sql: sql.raw(`t.${showTranslations.name.name}`),
			isNullable: false,
			accessor: (x) => x.name,
		},
		rating: shows.rating,
		airDate: shows.startAir,
		startAir: shows.startAir,
		endAir: shows.endAir,
		createdAt: shows.createdAt,
		nextRefresh: shows.nextRefresh,
		watchStatus: watchStatusQ.status,
		score: watchStatusQ.score,
	},
	{
		default: ["slug"],
		tablePk: shows.pk,
	},
);

const showRelations = {
	translations: () => {
		const { pk, language, ...trans } = getColumns(showTranslations);
		return db
			.select({
				json: jsonbObjectAgg(
					language,
					jsonbBuildObject<SerieTranslation>(trans),
				).as("json"),
			})
			.from(showTranslations)
			.where(eq(showTranslations.pk, shows.pk))
			.as("translations");
	},
	studios: ({ languages }: { languages: string[] }) => {
		const { pk: _, createdAt, updatedAt, ...studioCol } = getColumns(studios);
		const studioTransQ = db
			.selectDistinctOn([studioTranslations.pk])
			.from(studioTranslations)
			.orderBy(
				studioTranslations.pk,
				sql`array_position(${sqlarr(languages)}, ${studioTranslations.language})`,
			)
			.as("t");
		const { pk, language, ...studioTrans } = getColumns(studioTransQ);

		return db
			.select({
				json: coalesce(
					jsonbAgg(
						jsonbBuildObject<Studio>({
							...studioTrans,
							...studioCol,
							createdAt: sql`to_char(${createdAt}, 'YYYY-MM-DD"T"HH24:MI:SS"Z"')`,
							updatedAt: sql`to_char(${updatedAt}, 'YYYY-MM-DD"T"HH24:MI:SS"Z"')`,
						}),
					),
					sql`'[]'::jsonb`,
				).as("json"),
			})
			.from(studios)
			.innerJoin(studioTransQ, eq(studios.pk, studioTransQ.pk))
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
			)
			.as("studios");
	},
	// only available for movies
	videos: () => {
		const { guess, createdAt, updatedAt, ...videosCol } = getColumns(videos);
		return db
			.select({
				videos: coalesce(
					jsonbAgg(
						jsonbBuildObject<EmbeddedVideo>({
							slug: entryVideoJoin.slug,
							...videosCol,
						}),
					),
					sql`'[]'::jsonb`,
				).as("videos"),
			})
			.from(entryVideoJoin)
			.innerJoin(entries, eq(entries.showPk, shows.pk))
			.innerJoin(videos, eq(videos.pk, entryVideoJoin.videoPk))
			.where(eq(entryVideoJoin.entryPk, entries.pk))
			.as("videos");
	},
	firstEntry: ({ languages }: { languages: string[] }) => {
		const transQ = getEntryTransQ(languages);

		return db
			.select({
				firstEntry: jsonbBuildObject<Entry>({
					...getColumns(entries),
					...getColumns(transQ),
					number: entries.episodeNumber,
					videos: entryVideosQ.videos,
					progress: mapProgress({ aliased: false }),
					createdAt: sql`to_char(${entries.createdAt}, 'YYYY-MM-DD"T"HH24:MI:SS"Z"')`,
					updatedAt: sql`to_char(${entries.updatedAt}, 'YYYY-MM-DD"T"HH24:MI:SS"Z"')`,
				}).as("firstEntry"),
			})
			.from(entries)
			.innerJoin(transQ, eq(entries.pk, transQ.pk))
			.leftJoin(entryProgressQ, eq(entries.pk, entryProgressQ.entryPk))
			.crossJoinLateral(entryVideosQ)
			.where(and(eq(entries.showPk, shows.pk), ne(entries.kind, "extra")))
			.orderBy(entries.order)
			.limit(1)
			.as("firstEntry");
	},
	nextEntry: ({ languages }: { languages: string[] }) => {
		const transQ = getEntryTransQ(languages);

		return db
			.select({
				nextEntry: jsonbBuildObject<Entry>({
					...getColumns(entries),
					...getColumns(transQ),
					number: entries.episodeNumber,
					videos: entryVideosQ.videos,
					progress: mapProgress({ aliased: false }),
					createdAt: sql`to_char(${entries.createdAt}, 'YYYY-MM-DD"T"HH24:MI:SS"Z"')`,
					updatedAt: sql`to_char(${entries.updatedAt}, 'YYYY-MM-DD"T"HH24:MI:SS"Z"')`,
				}).as("nextEntry"),
			})
			.from(entries)
			.innerJoin(transQ, eq(entries.pk, transQ.pk))
			.leftJoin(entryProgressQ, eq(entries.pk, entryProgressQ.entryPk))
			.crossJoinLateral(entryVideosQ)
			.where(eq(watchStatusQ.nextEntry, entries.pk))
			.as("nextEntry");
	},
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
	userId,
}: {
	after?: string;
	limit: number;
	query?: string;
	sort?: Sort;
	filter?: SQL;
	languages: string[];
	fallbackLanguage?: boolean;
	preferOriginal?: boolean;
	relations?: (keyof typeof showRelations)[];
	userId: string;
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
			// ensure a stable sort to prevent future pages to contains the same element again
			showTranslations.language,
		)
		.as("t");

	return await db
		.select({
			...getColumns(shows),
			...getColumns(transQ),

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

			watchStatus: getColumns(watchStatusQ),

			...buildRelations(relations, showRelations, { languages }),
		})
		.from(shows)
		.leftJoin(watchStatusQ, eq(shows.pk, watchStatusQ.showPk))
		[fallbackLanguage ? "innerJoin" : ("leftJoin" as "innerJoin")](
			transQ,
			eq(shows.pk, transQ.pk),
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
			shows.pk,
		)
		.limit(limit)
		.execute({ userId });
}
