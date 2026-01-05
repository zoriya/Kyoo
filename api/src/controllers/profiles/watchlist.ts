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
import { coalesce, getColumns, rowToModel } from "~/db/utils";
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
import {
	MovieWatchStatus,
	SeedMovieWatchStatus,
	SeedSerieWatchStatus,
	SerieWatchStatus,
} from "~/models/watchlist";
import { getOrCreateProfile } from "./profile";

async function setWatchStatus({
	show,
	status,
	userPk,
}: {
	show:
		| { pk: number; kind: "movie" }
		| { pk: number; kind: "serie"; entriesCount: number };
	status: SeedSerieWatchStatus;
	userPk: number;
}) {
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
			startedAt: coalesce(sql`${status.startedAt ?? null}`, sql`now()`),
			profilePk: userPk,
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
				status: sql`excluded.status`,
				startedAt: coalesce(
					sql`${status.startedAt ?? null}`,
					watchlist.startedAt,
				),
				completedAt: sql`
					case
						when excluded.status = 'completed' then coalesce(excluded.completed_at, now())
						else coalesce(excluded.completed_at, ${watchlist.completedAt})
					end
				`,
				// only set seenCount & nextEntry when marking as "rewatching"
				// if it's already rewatching, the history updates are more up-dated.
				seenCount: sql`
					case
						when excluded.status = 'completed' then excluded.seen_count
						when excluded.status = 'rewatching' and ${watchlist.status} != 'rewatching' then excluded.seen_count
						else ${watchlist.seenCount}
					end
				`,
				nextEntry: sql`
					case
						when excluded.status = 'completed' then null
						when excluded.status = 'rewatching' and ${watchlist.status} != 'rewatching' then excluded.next_entry
						else ${watchlist.nextEntry}
					end
				`,
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
						headers: { "accept-language": languages, ...headers },
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
						return createPage(items, { url, sort, limit, headers });
					},
					{
						detail: { description: "Get all movies/series in your watchlist" },
						headers: t.Object({
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
						headers: {
							"accept-language": languages,
							authorization,
							...headers
						},
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
						return createPage(items, { url, sort, limit, headers });
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
			const profilePk = await getOrCreateProfile(sub);
			if (!profilePk) {
				return status(401, {
					status: 401,
					message: "Guest can't set watchstatus",
				});
			}

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
				userPk: profilePk,
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
			body: SeedSerieWatchStatus,
			response: {
				200: t.Intersect([SerieWatchStatus, DbMetadata]),
				401: { ...KError, description: "Guest can't set their watchstatus" },
				404: KError,
			},
			permissions: ["core.read"],
		},
	)
	.post(
		"/movies/:id/watchstatus",
		async ({ params: { id }, body, jwt: { sub }, status }) => {
			const profilePk = await getOrCreateProfile(sub);
			if (!profilePk) {
				return status(401, {
					status: 401,
					message: "Guest can't set watchstatus",
				});
			}

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
				userPk: profilePk,
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
			body: SeedMovieWatchStatus,
			response: {
				200: t.Intersect([MovieWatchStatus, DbMetadata]),
				401: { ...KError, description: "Guest can't set their watchstatus" },
				404: KError,
			},
			permissions: ["core.read"],
		},
	)
	.delete(
		"/series/:id/watchstatus",
		async ({ params: { id }, jwt: { sub }, status }) => {
			const profilePk = await getOrCreateProfile(sub);
			if (!profilePk) {
				return status(401, {
					status: 401,
					message: "Guest can't set watchstatus",
				});
			}

			const rows = await db.execute(sql`
				delete from ${watchlist} using ${shows}
				where ${and(
					eq(watchlist.profilePk, profilePk),
					eq(watchlist.showPk, shows.pk),
					eq(shows.kind, "serie"),
					isUuid(id) ? eq(shows.id, id) : eq(shows.slug, id),
				)}
				returning ${watchlist}.*
			`);

			if (rows.rowCount === 0) {
				return status(404, {
					status: 404,
					message: `No serie found in your watchlist the id/slug: '${id}'.`,
				});
			}

			return rowToModel(rows.rows[0], watchlist);
		},
		{
			detail: { description: "Set watchstatus of a serie." },
			params: t.Object({
				id: t.String({
					description: "The id or slug of the serie.",
					example: madeInAbyss.slug,
				}),
			}),
			response: {
				200: t.Intersect([SerieWatchStatus, DbMetadata]),
				401: KError,
				404: KError,
			},
			permissions: ["core.read"],
		},
	)
	.delete(
		"/movies/:id/watchstatus",
		async ({ params: { id }, jwt: { sub }, status }) => {
			const profilePk = await getOrCreateProfile(sub);
			if (!profilePk) {
				return status(401, {
					status: 401,
					message: "Guest can't set watchstatus",
				});
			}

			const rows = await db.execute(sql`
				delete from ${watchlist} using ${shows}
				where ${and(
					eq(watchlist.profilePk, profilePk),
					eq(watchlist.showPk, shows.pk),
					eq(shows.kind, "movie"),
					isUuid(id) ? eq(shows.id, id) : eq(shows.slug, id),
				)}
				returning ${watchlist}.*
			`);

			if (rows.rowCount === 0) {
				return status(404, {
					status: 404,
					message: `No movie found in your watchlist the id/slug: '${id}'.`,
				});
			}

			const ret = rowToModel(rows.rows[0], watchlist);
			return { ...ret, percent: ret.seenCount };
		},
		{
			detail: { description: "Set watchstatus of a movie." },
			params: t.Object({
				id: t.String({
					description: "The id or slug of the movie.",
					example: bubble.slug,
				}),
			}),
			response: {
				200: t.Intersect([MovieWatchStatus, DbMetadata]),
				401: { ...KError, description: "Guest can't set their watchstatus" },
				404: KError,
			},
			permissions: ["core.read"],
		},
	);
