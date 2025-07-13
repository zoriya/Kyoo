import { and, eq, isNotNull, isNull, sql } from "drizzle-orm";
import Elysia, { t } from "elysia";
import { auth, getUserInfo } from "~/auth";
import {
	getShows,
	showFilters,
	showSort,
	watchStatusQ,
} from "~/controllers/shows/logic";
import { db } from "~/db";
import { entries, shows } from "~/db/schema";
import { watchlist } from "~/db/schema/watchlist";
import { conflictUpdateAllExcept, getColumns } from "~/db/utils";
import { Entry } from "~/models/entry";
import { KError } from "~/models/error";
import { bubble, madeInAbyss } from "~/models/examples";
import { Movie } from "~/models/movie";
import { Serie } from "~/models/serie";
import {
	AcceptLanguage,
	createPage,
	DbMetadata,
	Filter,
	isUuid,
	Page,
	processLanguages,
} from "~/models/utils";
import { desc } from "~/models/utils/descriptions";
import { MovieWatchStatus, SerieWatchStatus } from "~/models/watchlist";
import { getOrCreateProfile } from "./profile";

async function setWatchStatus({
	show,
	status,
	userId,
}: {
	show:
		| { pk: number; kind: "movie" }
		| { pk: number; kind: "serie"; entriesCount: number };
	status: Omit<SerieWatchStatus, "seenCount">;
	userId: string;
}) {
	const profilePk = await getOrCreateProfile(userId);

	const firstEntryQ = db
		.select({ pk: entries.pk })
		.from(entries)
		.where(eq(entries.showPk, show.pk))
		.orderBy(entries.order)
		.limit(1);

	const [ret] = await db
		.insert(watchlist)
		.values({
			...status,
			profilePk: profilePk,
			seenCount:
				status.status === "completed"
					? show.kind === "movie"
						? 100
						: show.entriesCount
					: 0,
			showPk: show.pk,
			nextEntry:
				status.status === "watching" || status.status === "rewatching"
					? sql`${firstEntryQ}`
					: sql`null`,
			lastPlayedAt: status.startedAt,
		})
		.onConflictDoUpdate({
			target: [watchlist.profilePk, watchlist.showPk],
			set: {
				...conflictUpdateAllExcept(watchlist, [
					"profilePk",
					"showPk",
					"createdAt",
					"seenCount",
					"nextEntry",
					"lastPlayedAt",
				]),
				...(status.status === "completed"
					? {
							seenCount: sql`excluded.seen_count`,
							nextEntry: sql`null`,
						}
					: {}),
				// only set seenCount & nextEntry when marking as "rewatching"
				// if it's already rewatching, the history updates are more up-dated.
				...(status.status === "rewatching"
					? {
							seenCount: sql`
							case when ${watchlist.status} != 'rewatching'
								then excluded.seen_count
							else
								${watchlist.seenCount}
							end`,
							nextEntry: sql`
							case when ${watchlist.status} != 'rewatching'
								then excluded.next_entry
							else
								${watchlist.nextEntry}
							end`,
						}
					: {}),
			},
		})
		.returning({
			...getColumns(watchlist),
			percent: sql<number>`${watchlist.seenCount}`.as("percent"),
		});
	return ret;
}

export const watchlistH = new Elysia({ tags: ["profiles"] })
	.use(auth)
	.guard(
		{
			query: t.Object({
				sort: {
					...showSort,
					default: ["watchStatus", ...showSort.default],
				},
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
		},
		(app) =>
			app
				.get(
					"/profiles/me/watchlist",
					async ({
						query: { limit, after, query, sort, filter, preferOriginal },
						headers: { "accept-language": languages },
						request: { url },
						jwt: { sub, settings },
					}) => {
						const langs = processLanguages(languages);
						const items = await getShows({
							limit,
							after,
							query,
							sort,
							filter: and(
								isNotNull(watchStatusQ.status),
								isNull(shows.collectionPk),
								filter,
							),
							languages: langs,
							preferOriginal: preferOriginal ?? settings.preferOriginal,
							relations: ["nextEntry"],
							userId: sub,
						});
						return createPage(items, { url, sort, limit });
					},
					{
						detail: { description: "Get all movies/series in your watchlist" },
						headers: t.Object(
							{
								"accept-language": AcceptLanguage({ autoFallback: true }),
							},
							{ additionalProperties: true },
						),
						response: {
							200: Page(
								t.Union([
									t.Intersect([Movie, t.Object({ kind: t.Literal("movie") })]),
									t.Intersect([
										Serie,
										t.Object({
											kind: t.Literal("serie"),
											nextEntry: t.Optional(t.Nullable(Entry)),
										}),
									]),
								]),
							),
							422: KError,
						},
					},
				)
				.get(
					"/profiles/:id/watchlist",
					async ({
						params: { id },
						query: { limit, after, query, sort, filter, preferOriginal },
						jwt: { settings },
						headers: { "accept-language": languages, authorization },
						request: { url },
						status,
					}) => {
						const uInfo = await getUserInfo(id, { authorization });
						if ("status" in uInfo) return status(uInfo.status as 404, uInfo);

						const langs = processLanguages(languages);
						const items = await getShows({
							limit,
							after,
							query,
							sort,
							filter: and(
								isNotNull(watchStatusQ.status),
								isNull(shows.collectionPk),
								filter,
							),
							languages: langs,
							preferOriginal: preferOriginal ?? settings.preferOriginal,
							relations: ["nextEntry"],
							userId: uInfo.id,
						});
						return createPage(items, { url, sort, limit });
					},
					{
						detail: {
							description: "Get all movies/series in someone's watchlist",
						},
						params: t.Object({
							id: t.String({
								description:
									"The id or username of the user to read the watchlist of",
								example: "zoriya",
							}),
						}),
						headers: t.Object({
							authorization: t.TemplateLiteral("Bearer ${string}"),
							"accept-language": AcceptLanguage({ autoFallback: true }),
						}),
						response: {
							200: Page(
								t.Union([
									t.Intersect([Movie, t.Object({ kind: t.Literal("movie") })]),
									t.Intersect([
										Serie,
										t.Object({
											kind: t.Literal("serie"),
											nextEntry: t.Optional(t.Nullable(Entry)),
										}),
									]),
								]),
							),
							403: KError,
							404: {
								...KError,
								description: "No user found with the specified id/username.",
							},
							422: KError,
						},
						permissions: ["users.read"],
					},
				),
	)
	.post(
		"/series/:id/watchstatus",
		async ({ params: { id }, body, jwt: { sub }, status }) => {
			const [show] = await db
				.select({ pk: shows.pk, entriesCount: shows.entriesCount })
				.from(shows)
				.where(
					and(
						eq(shows.kind, "serie"),
						isUuid(id) ? eq(shows.id, id) : eq(shows.slug, id),
					),
				);

			if (!show) {
				return status(404, {
					status: 404,
					message: `No serie found for the id/slug: '${id}'.`,
				});
			}
			return await setWatchStatus({
				show: { pk: show.pk, kind: "serie", entriesCount: show.entriesCount },
				userId: sub,
				status: body,
			});
		},
		{
			detail: { description: "Set watchstatus of a series." },
			params: t.Object({
				id: t.String({
					description: "The id or slug of the serie.",
					example: madeInAbyss.slug,
				}),
			}),
			body: t.Omit(SerieWatchStatus, ["seenCount"]),
			response: {
				200: t.Intersect([SerieWatchStatus, DbMetadata]),
				404: KError,
			},
			permissions: ["core.read"],
		},
	)
	.post(
		"/movies/:id/watchstatus",
		async ({ params: { id }, body, jwt: { sub }, status }) => {
			const [show] = await db
				.select({ pk: shows.pk })
				.from(shows)
				.where(
					and(
						eq(shows.kind, "movie"),
						isUuid(id) ? eq(shows.id, id) : eq(shows.slug, id),
					),
				);

			if (!show) {
				return status(404, {
					status: 404,
					message: `No movie found for the id/slug: '${id}'.`,
				});
			}

			return await setWatchStatus({
				show: { pk: show.pk, kind: "movie" },
				userId: sub,
				status: {
					...body,
					startedAt: body.completedAt,
				},
			});
		},
		{
			detail: { description: "Set watchstatus of a movie." },
			params: t.Object({
				id: t.String({
					description: "The id or slug of the movie.",
					example: bubble.slug,
				}),
			}),
			body: t.Omit(MovieWatchStatus, ["percent"]),
			response: {
				200: t.Intersect([MovieWatchStatus, DbMetadata]),
				404: KError,
			},
			permissions: ["core.read"],
		},
	);
