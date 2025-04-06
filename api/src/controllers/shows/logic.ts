import {
	type SQL,
	type Subquery,
	and,
	desc,
	eq,
	exists,
	ne,
	sql,
} from "drizzle-orm";
import type { PgSelect } from "drizzle-orm/pg-core";
import { db } from "~/db";
import {
	entries,
	entryTranslations,
	entryVideoJoin,
	history,
	profiles,
	showStudioJoin,
	showTranslations,
	shows,
	studioTranslations,
	studios,
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
	type FilterDef,
	Genre,
	type Image,
	Sort,
	buildRelations,
	keysetPaginate,
	sortToSql,
} from "~/models/utils";
import type { EmbeddedVideo } from "~/models/video";
import { entryVideosQ, getEntryProgressQ, mapProgress } from "../entries";

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
	{
		slug: shows.slug,
		rating: shows.rating,
		airDate: shows.startAir,
		startAir: shows.startAir,
		endAir: shows.endAir,
		createdAt: shows.createdAt,
		nextRefresh: shows.nextRefresh,
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
		const { pk: _, ...studioCol } = getColumns(studios);
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
					jsonbAgg(jsonbBuildObject<Studio>({ ...studioTrans, ...studioCol })),
					sql`'[]'::jsonb`,
				).as("json"),
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
			.where(eq(entryVideoJoin.entryPk, entries.pk))
			.leftJoin(entries, eq(entries.showPk, shows.pk))
			.leftJoin(videos, eq(videos.pk, entryVideoJoin.videoPk))
			.as("videos");
	},
	firstEntry: ({
		languages,
		userId,
	}: { languages: string[]; userId: string }) => {
		const transQ = db
			.selectDistinctOn([entryTranslations.pk])
			.from(entryTranslations)
			.orderBy(
				entryTranslations.pk,
				sql`array_position(${sqlarr(languages)}, ${entryTranslations.language})`,
			)
			.as("t");
		const { pk, ...transCol } = getColumns(transQ);

		const progressQ = getEntryProgressQ(userId);

		return db
			.select({
				firstEntry: jsonbBuildObject<Entry>({
					...getColumns(entries),
					...transCol,
					number: entries.episodeNumber,
					videos: entryVideosQ.videos,
					progress: mapProgress(progressQ),
				}).as("firstEntry"),
			})
			.from(entries)
			.innerJoin(transQ, eq(entries.pk, transQ.pk))
			.leftJoin(progressQ, eq(entries.pk, progressQ.entryPk))
			.leftJoinLateral(entryVideosQ, sql`true`)
			.where(and(eq(entries.showPk, shows.pk), ne(entries.kind, "extra")))
			.orderBy(entries.order)
			.limit(1)
			.as("firstEntry");
	},
	nextEntry: ({
		languages,
		userId,
		watchStatusQ,
	}: {
		languages: string[];
		userId: string;
		watchStatusQ: Subquery;
	}) => {
		const transQ = db
			.selectDistinctOn([entryTranslations.pk])
			.from(entryTranslations)
			.orderBy(
				entryTranslations.pk,
				sql`array_position(${sqlarr(languages)}, ${entryTranslations.language})`,
			)
			.as("t");
		const { pk, ...transCol } = getColumns(transQ);

		const progressQ = getEntryProgressQ(userId);

		return db
			.select({
				nextEntry: jsonbBuildObject<Entry>({
					...getColumns(entries),
					...transCol,
					number: entries.episodeNumber,
					videos: entryVideosQ.videos,
					progress: mapProgress(progressQ),
				}).as("nextEntry"),
			})
			.from(entries)
			.innerJoin(transQ, eq(entries.pk, transQ.pk))
			.leftJoin(progressQ, eq(entries.pk, progressQ.entryPk))
			.leftJoinLateral(entryVideosQ, sql`true`)
			.where(
				eq((watchStatusQ as unknown as typeof watchlist).nextEntry, entries.pk),
			)
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
		)
		.as("t");

	const watchStatusQ = db
		.select({
			...getColumns(watchlist),
			percent: sql`${watchlist.seenCount}`.as("percent"),
		})
		.from(watchlist)
		.leftJoin(profiles, eq(watchlist.profilePk, profiles.pk))
		.where(eq(profiles.id, userId))
		.as("watchstatus");

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

			...buildRelations(relations, showRelations, {
				languages,
				userId,
				watchStatusQ,
			}),
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
		.limit(limit);
}
