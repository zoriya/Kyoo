import { and, desc, eq, isNotNull, ne, type SQL, sql } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { auth } from "~/auth";
import { db } from "~/db";
import {
	entries,
	entryTranslations,
	entryVideoJoin,
	history,
	profiles,
	shows,
	videos,
} from "~/db/schema";
import {
	coalesce,
	getColumns,
	jsonbAgg,
	jsonbBuildObject,
	sqlarr,
} from "~/db/utils";
import {
	Entry,
	type EntryKind,
	Episode,
	Extra,
	ExtraType,
	MovieEntry,
	Special,
} from "~/models/entry";
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
import { desc as description } from "~/models/utils/descriptions";
import type { EmbeddedVideo } from "~/models/video";

export const entryProgressQ = db
	.selectDistinctOn([history.entryPk], {
		percent: history.percent,
		time: history.time,
		entryPk: history.entryPk,
		playedDate: history.playedDate,
		videoId: videos.id,
	})
	.from(history)
	.leftJoin(videos, eq(history.videoPk, videos.pk))
	.innerJoin(profiles, eq(history.profilePk, profiles.pk))
	.where(eq(profiles.id, sql.placeholder("userId")))
	.orderBy(history.entryPk, desc(history.playedDate))
	.as("progress");

export const entryFilters: FilterDef = {
	kind: {
		column: entries.kind,
		type: "enum",
		values: ["episode", "movie", "special"],
	},
	seasonNumber: { column: entries.seasonNumber, type: "int" },
	episodeNumber: { column: entries.episodeNumber, type: "int" },
	number: { column: entries.episodeNumber, type: "int" },
	order: { column: entries.order, type: "float" },
	runtime: { column: entries.runtime, type: "float" },
	airDate: { column: entries.airDate, type: "date" },
	playedDate: { column: entryProgressQ.playedDate, type: "date" },
	isAvailable: { column: isNotNull(entries.availableSince), type: "bool" },
};

const extraFilters: FilterDef = {
	kind: { column: entries.extraKind, type: "enum", values: ExtraType.enum },
	runtime: { column: entries.runtime, type: "float" },
	playedDate: { column: entryProgressQ.playedDate, type: "date" },
};

export const entrySort = Sort(
	{
		order: entries.order,
		seasonNumber: entries.seasonNumber,
		episodeNumber: entries.episodeNumber,
		number: entries.episodeNumber,
		airDate: entries.airDate,
		nextRefresh: entries.nextRefresh,
		playedDate: entryProgressQ.playedDate,
	},
	{
		default: ["order"],
		tablePk: entries.pk,
	},
);

const extraSort = Sort(
	{
		slug: entries.slug,
		name: entryTranslations.name,
		runtime: entries.runtime,
		createdAt: entries.createdAt,
		playedDate: entryProgressQ.playedDate,
	},
	{
		default: ["slug"],
		tablePk: entries.pk,
	},
);

const newsSort: Sort = {
	tablePk: entries.pk,
	sort: [
		{
			sql: entries.availableSince,
			// in the news query we already filter nulls out
			isNullable: false,
			accessor: (x) => x.availableSince,
			desc: false,
		},
	],
};
const { guess, createdAt, updatedAt, ...videosCol } = getColumns(videos);
export const entryVideosQ = db
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
	.leftJoin(videos, eq(videos.pk, entryVideoJoin.videoPk))
	.as("videos");

export const getEntryTransQ = (languages: string[]) => {
	return db
		.selectDistinctOn([entryTranslations.pk])
		.from(entryTranslations)
		.orderBy(
			entryTranslations.pk,
			sql`array_position(${sqlarr(languages)}, ${entryTranslations.language})`,
		)
		.as("entry_t");
};

export const mapProgress = ({ aliased }: { aliased: boolean }) => {
	const { time, percent, playedDate, videoId } = getColumns(entryProgressQ);
	const ret = {
		time: coalesce(time, sql<number>`0`),
		percent: coalesce(percent, sql<number>`0`),
		playedDate: sql`to_char(${playedDate}, 'YYYY-MM-DD"T"HH24:MI:SS"Z"')`,
		videoId: sql<string>`${videoId}`,
	};
	if (!aliased) return ret;
	return Object.fromEntries(
		Object.entries(ret).map(([k, v]) => [k, v.as(k)]),
	) as unknown as typeof ret;
};

export async function getEntries({
	after,
	limit,
	query,
	sort,
	filter,
	languages,
	userId,
	progressQ = entryProgressQ,
}: {
	after: string | undefined;
	limit: number;
	query: string | undefined;
	sort: Sort;
	filter: SQL | undefined;
	languages: string[];
	userId: string;
	progressQ?: typeof entryProgressQ;
}): Promise<(Entry | Extra)[]> {
	const transQ = getEntryTransQ(languages);

	const {
		kind,
		externalId,
		order,
		seasonNumber,
		episodeNumber,
		extraKind,
		...entryCol
	} = getColumns(entries);
	return await db
		.select({
			...entryCol,
			...getColumns(transQ),
			videos: entryVideosQ.videos,
			progress: mapProgress({ aliased: true }),
			// specials don't have an `episodeNumber` but a `number` field.
			number: sql<number>`${episodeNumber}`,

			// merge `extraKind` into `kind`
			kind: sql<EntryKind>`case when ${kind} = 'extra' then ${extraKind} else ${kind}::text end`.as(
				"kind",
			),

			// assign more restrained types to make typescript happy.
			externalId: sql<any>`${externalId}`,
			order: sql<number>`${order}`,
			seasonNumber: sql<number>`${seasonNumber}`,
			episodeNumber: sql<number>`${episodeNumber}`,
			name: sql<string>`${transQ.name}`,
		})
		.from(entries)
		.innerJoin(transQ, eq(entries.pk, transQ.pk))
		.crossJoinLateral(entryVideosQ)
		.leftJoin(progressQ, eq(entries.pk, progressQ.entryPk))
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
			entries.pk,
		)
		.limit(limit)
		.execute({ userId });
}

export const entriesH = new Elysia({ tags: ["series"] })
	.model({
		episode: Episode,
		movie_entry: MovieEntry,
		special: Special,
		extra: Extra,
		error: t.Object({}),
	})
	.model((models) => ({
		...models,
		entry: t.Union([models.episode, models.movie_entry, models.special]),
	}))
	.use(auth)
	.get(
		"/series/:id/entries",
		async ({
			params: { id },
			query: { limit, after, query, sort, filter },
			headers: { "accept-language": languages },
			request: { url },
			jwt: { sub },
			status,
		}) => {
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

			const langs = processLanguages(languages);
			const items = (await getEntries({
				limit,
				after,
				query,
				sort,
				filter: and(
					eq(entries.showPk, serie.pk),
					ne(entries.kind, "extra"),
					filter,
				),
				languages: langs,
				userId: sub,
			})) as Entry[];

			return createPage(items, { url, sort, limit });
		},
		{
			detail: { description: "Get entries of a serie" },
			params: t.Object({
				id: t.String({
					description: "The id or slug of the serie.",
					example: madeInAbyss.slug,
				}),
			}),
			query: t.Object({
				sort: entrySort,
				filter: t.Optional(Filter({ def: entryFilters })),
				query: t.Optional(t.String({ description: description.query })),
				limit: t.Integer({
					minimum: 1,
					maximum: 250,
					default: 50,
					description: "Max page size.",
				}),
				after: t.Optional(t.String({ description: description.after })),
			}),
			headers: t.Object(
				{
					"accept-language": AcceptLanguage({ autoFallback: true }),
				},
				{ additionalProperties: true },
			),
			response: {
				200: Page(Entry),
				404: {
					...KError,
					description: "No serie found with the given id or slug.",
				},
				422: KError,
			},
		},
	)
	.get(
		"/series/:id/extras",
		async ({
			params: { id },
			query: { limit, after, query, sort, filter },
			request: { url },
			jwt: { sub },
			status,
		}) => {
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

			const items = (await getEntries({
				limit,
				after,
				query,
				sort: sort,
				filter: and(
					eq(entries.showPk, serie.pk),
					eq(entries.kind, "extra"),
					filter,
				),
				languages: ["extra"],
				userId: sub,
			})) as Extra[];

			return createPage(items, { url, sort, limit });
		},
		{
			detail: { description: "Get extras of a serie" },
			params: t.Object({
				id: t.String({
					description: "The id or slug of the serie.",
					example: madeInAbyss.slug,
				}),
			}),
			query: t.Object({
				sort: extraSort,
				filter: t.Optional(Filter({ def: extraFilters })),
				query: t.Optional(t.String({ description: description.query })),
				limit: t.Integer({
					minimum: 1,
					maximum: 250,
					default: 50,
					description: "Max page size.",
				}),
				after: t.Optional(t.String({ description: description.after })),
			}),
			response: {
				200: Page(Extra),
				404: {
					...KError,
					description: "No serie found with the given id or slug.",
				},
				422: KError,
			},
		},
	)
	.get(
		"/news",
		async ({
			query: { limit, after, query, filter },
			request: { url },
			jwt: { sub },
		}) => {
			const sort = newsSort;
			const items = (await getEntries({
				limit,
				after,
				query,
				sort,
				filter: and(
					isNotNull(entries.availableSince),
					ne(entries.kind, "extra"),
					filter,
				),
				languages: ["extra"],
				userId: sub,
			})) as Entry[];

			return createPage(items, { url, sort, limit });
		},
		{
			detail: { description: "Get new movies/episodes added recently." },
			query: t.Object({
				filter: t.Optional(Filter({ def: entryFilters })),
				query: t.Optional(t.String({ description: description.query })),
				limit: t.Integer({
					minimum: 1,
					maximum: 250,
					default: 50,
					description: "Max page size.",
				}),
				after: t.Optional(t.String({ description: description.after })),
			}),
			response: {
				200: Page(Entry),
				422: KError,
			},
			tags: ["shows"],
		},
	);
