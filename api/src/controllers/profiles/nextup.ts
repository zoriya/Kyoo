import { and, eq, sql } from "drizzle-orm";
import Elysia, { t } from "elysia";
import { auth } from "~/auth";
import { db } from "~/db";
import { entries } from "~/db/schema";
import { watchlist } from "~/db/schema/watchlist";
import { getColumns } from "~/db/utils";
import { Entry } from "~/models/entry";
import {
	AcceptLanguage,
	createPage,
	Filter,
	type FilterDef,
	keysetPaginate,
	Page,
	processLanguages,
	Sort,
	sortToSql,
} from "~/models/utils";
import { desc } from "~/models/utils/descriptions";
import {
	entryFilters,
	entryProgressQ,
	entryVideosQ,
	getEntryTransQ,
	mapProgress,
} from "../entries";

const nextupSort = Sort(
	// copy pasted from entrySort + adding new stuff
	{
		order: entries.order,
		seasonNumber: entries.seasonNumber,
		episodeNumber: entries.episodeNumber,
		number: entries.episodeNumber,
		airDate: entries.airDate,

		started: watchlist.startedAt,
		added: watchlist.createdAt,
		lastPlayed: watchlist.lastPlayedAt,
	},
	{
		default: ["-lastPlayed"],
		tablePk: entries.pk,
	},
);

const nextupFilters: FilterDef = {
	...entryFilters,
};

export const nextup = new Elysia({ tags: ["profiles"] })
	.use(auth)
	.guard({
		query: t.Object({
			sort: nextupSort,
			filter: t.Optional(Filter({ def: nextupFilters })),
			query: t.Optional(t.String({ description: desc.query })),
			limit: t.Integer({
				minimum: 1,
				maximum: 250,
				default: 50,
				description: "Max page size.",
			}),
			after: t.Optional(t.String({ description: desc.after })),
		}),
	})
	.get(
		"/profiles/me/nextup",
		async ({
			query: { sort, filter, query, limit, after },
			headers: { "accept-language": languages },
			request: { url },
			jwt: { sub },
		}) => {
			const langs = processLanguages(languages);
			const transQ = getEntryTransQ(langs);

			const {
				externalId,
				order,
				seasonNumber,
				episodeNumber,
				extraKind,
				kind,
				...entryCol
			} = getColumns(entries);

			const items = await db
				.select({
					...entryCol,
					...getColumns(transQ),
					videos: entryVideosQ.videos,
					progress: mapProgress({ aliased: true }),
					// specials don't have an `episodeNumber` but a `number` field.
					number: sql<number>`${episodeNumber}`,

					// assign more restrained types to make typescript happy.
					kind: sql<Entry["kind"]>`${kind}`,
					externalId: sql<any>`${externalId}`,
					order: sql<number>`${order}`,
					seasonNumber: sql<number>`${seasonNumber}`,
					episodeNumber: sql<number>`${episodeNumber}`,
					name: sql<string>`${transQ.name}`,
				})
				.from(entries)
				.innerJoin(watchlist, eq(watchlist.nextEntry, entries.pk))
				.innerJoin(transQ, eq(entries.pk, transQ.pk))
				.crossJoinLateral(entryVideosQ)
				.leftJoin(entryProgressQ, eq(entries.pk, entryProgressQ.entryPk))
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
				.execute({ userId: sub });

			return createPage(items, { url, sort, limit });
		},
		{
			detail: {
				description: "",
			},
			headers: t.Object(
				{
					"accept-language": AcceptLanguage({ autoFallback: true }),
				},
				{ additionalProperties: true },
			),
			response: {
				200: Page(Entry),
			},
		},
	);
