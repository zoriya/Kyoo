import { type SQL, and, eq, isNotNull, ne, sql } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "~/db";
import {
	entries,
	entryTranslations,
	entryVideoJoin,
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
	UnknownEntry,
} from "~/models/entry";
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
import type { EmbeddedVideo } from "~/models/video";

const entryFilters: FilterDef = {
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
};

const extraFilters: FilterDef = {
	kind: { column: entries.extraKind, type: "enum", values: ExtraType.enum },
	runtime: { column: entries.runtime, type: "float" },
};

const unknownFilters: FilterDef = {
	runtime: { column: entries.runtime, type: "float" },
};

const entrySort = Sort(
	{
		order: entries.order,
		seasonNumber: entries.seasonNumber,
		episodeNumber: entries.episodeNumber,
		number: entries.episodeNumber,
		airDate: entries.airDate,
		nextRefresh: entries.nextRefresh,
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

async function getEntries({
	after,
	limit,
	query,
	sort,
	filter,
	languages,
}: {
	after: string | undefined;
	limit: number;
	query: string | undefined;
	sort: Sort;
	filter: SQL | undefined;
	languages: string[];
}): Promise<(Entry | Extra | UnknownEntry)[]> {
	const transQ = db
		.selectDistinctOn([entryTranslations.pk])
		.from(entryTranslations)
		.orderBy(
			entryTranslations.pk,
			sql`array_position(${sqlarr(languages)}, ${entryTranslations.language})`,
		)
		.as("t");
	const { pk, name, ...transCol } = getColumns(transQ);

	const { guess, createdAt, updatedAt, ...videosCol } = getColumns(videos);
	const videosQ = db
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
			...transCol,
			videos: videosQ.videos,
			// specials don't have an `episodeNumber` but a `number` field.
			number: episodeNumber,

			// merge `extraKind` into `kind`
			kind: sql<EntryKind>`case when ${kind} = 'extra' then ${extraKind} else ${kind}::text end`.as(
				"kind",
			),

			// assign more restrained types to make typescript happy.
			externalId: sql<any>`${externalId}`,
			order: sql<number>`${order}`,
			seasonNumber: sql<number>`${seasonNumber}`,
			episodeNumber: sql<number>`${episodeNumber}`,
			name: sql<string>`${name}`,
		})
		.from(entries)
		.innerJoin(transQ, eq(entries.pk, transQ.pk))
		.leftJoinLateral(videosQ, sql`true`)
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
		.limit(limit);
}

export const entriesH = new Elysia({ tags: ["series"] })
	.model({
		episode: Episode,
		movie_entry: MovieEntry,
		special: Special,
		extra: Extra,
		unknown_entry: UnknownEntry,
		error: t.Object({}),
	})
	.model((models) => ({
		...models,
		entry: t.Union([models.episode, models.movie_entry, models.special]),
	}))
	.get(
		"/series/:id/entries",
		async ({
			params: { id },
			query: { limit, after, query, sort, filter },
			headers: { "accept-language": languages },
			request: { url },
			error,
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
				return error(404, {
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
					ne(entries.kind, "unknown"),
					filter,
				),
				languages: langs,
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
			error,
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
				return error(404, {
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
				query: t.Optional(t.String({ description: desc.query })),
				limit: t.Integer({
					minimum: 1,
					maximum: 250,
					default: 50,
					description: "Max page size.",
				}),
				after: t.Optional(t.String({ description: desc.after })),
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
		"/unknowns",
		async ({
			query: { limit, after, query, sort, filter },
			request: { url },
		}) => {
			const items = (await getEntries({
				limit,
				after,
				query,
				sort: sort,
				filter: and(eq(entries.kind, "unknown"), filter),
				languages: ["extra"],
			})) as UnknownEntry[];

			return createPage(items, { url, sort, limit });
		},
		{
			detail: { description: "Get unknown/unmatch videos." },
			query: t.Object({
				sort: extraSort,
				filter: t.Optional(Filter({ def: unknownFilters })),
				query: t.Optional(t.String({ description: desc.query })),
				limit: t.Integer({
					minimum: 1,
					maximum: 250,
					default: 50,
					description: "Max page size.",
				}),
				after: t.Optional(t.String({ description: desc.after })),
			}),
			response: {
				200: Page(UnknownEntry),
				422: KError,
			},
			tags: ["videos"],
		},
	)
	.get(
		"/news",
		async ({ query: { limit, after, query, filter }, request: { url } }) => {
			const sort = newsSort;
			const items = (await getEntries({
				limit,
				after,
				query,
				sort,
				filter: and(
					isNotNull(entries.availableSince),
					ne(entries.kind, "unknown"),
					ne(entries.kind, "extra"),
					filter,
				),
				languages: ["extra"],
			})) as Entry[];

			return createPage(items, { url, sort, limit });
		},
		{
			detail: { description: "Get new movies/episodes added recently." },
			query: t.Object({
				filter: t.Optional(Filter({ def: entryFilters })),
				query: t.Optional(t.String({ description: desc.query })),
				limit: t.Integer({
					minimum: 1,
					maximum: 250,
					default: 50,
					description: "Max page size.",
				}),
				after: t.Optional(t.String({ description: desc.after })),
			}),
			response: {
				200: Page(Entry),
				422: KError,
			},
			tags: ["videos"],
		},
	);
