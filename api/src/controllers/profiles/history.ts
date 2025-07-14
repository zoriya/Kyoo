import { and, count, eq, exists, gt, isNotNull, ne, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import Elysia, { t } from "elysia";
import { auth, getUserInfo } from "~/auth";
import { db } from "~/db";
import { entries, history, profiles, shows, videos } from "~/db/schema";
import { watchlist } from "~/db/schema/watchlist";
import { coalesce, values } from "~/db/utils";
import { Entry } from "~/models/entry";
import { KError } from "~/models/error";
import { SeedHistory } from "~/models/history";
import {
	AcceptLanguage,
	createPage,
	Filter,
	isUuid,
	Page,
	processLanguages,
} from "~/models/utils";
import { desc } from "~/models/utils/descriptions";
import type { WatchlistStatus } from "~/models/watchlist";
import {
	entryFilters,
	entryProgressQ,
	entrySort,
	getEntries,
} from "../entries";
import { getOrCreateProfile } from "./profile";

const historyProgressQ: typeof entryProgressQ = db
	.select({
		percent: history.percent,
		time: history.time,
		entryPk: history.entryPk,
		playedDate: history.playedDate,
		videoId: videos.id,
	})
	.from(history)
	.leftJoin(videos, eq(history.videoPk, videos.pk))
	.leftJoin(profiles, eq(history.profilePk, profiles.pk))
	.where(eq(profiles.id, sql.placeholder("userId")))
	.as("progress");

export const historyH = new Elysia({ tags: ["profiles"] })
	.use(auth)
	.guard(
		{
			query: t.Object({
				sort: {
					...entrySort,
					default: ["-playedDate"],
				},
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
		},
		(app) =>
			app
				.get(
					"/profiles/me/history",
					async ({
						query: { sort, filter, query, limit, after },
						headers: { "accept-language": languages },
						request: { url },
						jwt: { sub },
					}) => {
						const langs = processLanguages(languages);
						const items = (await getEntries({
							limit,
							after,
							query,
							sort,
							filter: and(
								isNotNull(entryProgressQ.playedDate),
								ne(entries.kind, "extra"),
								filter,
							),
							languages: langs,
							userId: sub,
							progressQ: historyProgressQ,
						})) as Entry[];

						return createPage(items, { url, sort, limit });
					},
					{
						detail: {
							description: "List your watch history (episodes/movies seen)",
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
				)
				.get(
					"/profiles/:id/history",
					async ({
						params: { id },
						query: { sort, filter, query, limit, after },
						headers: { "accept-language": languages, authorization },
						request: { url },
						status,
					}) => {
						const uInfo = await getUserInfo(id, { authorization });
						if ("status" in uInfo) return status(uInfo.status as 404, uInfo);

						const langs = processLanguages(languages);
						const items = (await getEntries({
							limit,
							after,
							query,
							sort,
							filter: and(
								isNotNull(entryProgressQ.playedDate),
								ne(entries.kind, "extra"),
								filter,
							),
							languages: langs,
							userId: uInfo.id,
							progressQ: historyProgressQ,
						})) as Entry[];

						return createPage(items, { url, sort, limit });
					},
					{
						detail: {
							description: "List your watch history (episodes/movies seen)",
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
							200: Page(Entry),
							403: KError,
							404: {
								...KError,
								description: "No user found with the specified id/username.",
							},
							422: KError,
						},
					},
				),
	)
	.post(
		"/profiles/me/history",
		async ({ body, jwt: { sub }, status }) => {
			const profilePk = await getOrCreateProfile(sub);

			const hist = values(
				body.map((x) => ({ ...x, entryUseId: isUuid(x.entry) })),
				{
					percent: "integer",
					time: "integer",
					playedDate: "timestamptz",
					videoId: "uuid",
				},
			).as("hist");
			const valEqEntries = sql`
				case
					when hist.entryUseId::boolean then ${entries.id} = hist.entry::uuid
					else ${entries.slug} = hist.entry
				end
			`;

			const rows = await db
				.insert(history)
				.select(
					db
						.select({
							profilePk: sql`${profilePk}`.as("profilePk"),
							entryPk: entries.pk,
							videoPk: videos.pk,
							percent: sql`hist.percent`.as("percent"),
							time: sql`hist.time`.as("time"),
							playedDate: sql`hist.playedDate`.as("playedDate"),
						})
						.from(hist)
						.innerJoin(entries, valEqEntries)
						.leftJoin(videos, eq(videos.id, sql`hist.videoId`)),
				)
				.returning({ pk: history.pk });

			// automatically update watchlist with this new info

			const nextEntry = alias(entries, "next_entry");
			const nextEntryQ = db
				.select({
					pk: nextEntry.pk,
				})
				.from(nextEntry)
				.where(
					and(
						eq(nextEntry.showPk, entries.showPk),
						ne(nextEntry.kind, "extra"),
						gt(nextEntry.order, entries.order),
					),
				)
				.orderBy(nextEntry.order)
				.limit(1)
				.as("nextEntryQ");

			const seenCountQ = db
				.select({ c: count() })
				.from(entries)
				.where(
					and(
						eq(entries.showPk, sql`excluded.show_pk`),
						exists(
							db
								.select()
								.from(history)
								.where(
									and(
										eq(history.profilePk, profilePk),
										eq(history.entryPk, entries.pk),
									),
								),
						),
					),
				);

			const showKindQ = db
				.select({ k: shows.kind })
				.from(shows)
				.where(eq(shows.pk, sql`excluded.show_pk`));

			await db
				.insert(watchlist)
				.select(
					db
						.select({
							profilePk: sql`${profilePk}`.as("profilePk"),
							showPk: entries.showPk,
							status: sql<WatchlistStatus>`
								case
									when
										hist.percent >= 95
										and ${nextEntryQ.pk} is null
									then 'completed'::watchlist_status
									else 'watching'::watchlist_status
								end
							`.as("status"),
							seenCount: sql`
								case
									when ${entries.kind} = 'movie' then hist.percent
									when hist.percent >= 95 then 1
									else 0
								end
							`.as("seen_count"),
							nextEntry: sql`
								case
									when hist.percent >= 95 then ${nextEntryQ.pk}
									else ${entries.pk}
								end
							`.as("next_entry"),
							score: sql`null`.as("score"),
							startedAt: sql`hist.playedDate`.as("startedAt"),
							lastPlayedAt: sql`hist.playedDate`.as("lastPlayedAt"),
							completedAt: sql`
								case
									when ${nextEntryQ.pk} is null then hist.playedDate
									else null
								end
							`.as("completedAt"),
							// see https://github.com/drizzle-team/drizzle-orm/issues/3608
							updatedAt: sql`now()`.as("updatedAt"),
						})
						.from(hist)
						.leftJoin(entries, valEqEntries)
						.leftJoinLateral(nextEntryQ, sql`true`),
				)
				.onConflictDoUpdate({
					target: [watchlist.profilePk, watchlist.showPk],
					set: {
						status: sql`
							case
								when excluded.status = 'completed' then excluded.status
								when
									${watchlist.status} != 'completed'
									and ${watchlist.status} != 'rewatching'
								then excluded.status
								else ${watchlist.status}
							end
						`,
						seenCount: sql`
							case
								when ${showKindQ} = 'movie' then excluded.seen_count
								else ${seenCountQ}
							end`,
						nextEntry: sql`
							case
								when ${watchlist.status} = 'completed' then null
								else excluded.next_entry
							end
						`,
						lastPlayedAt: sql`excluded.last_played_at`,
						completedAt: coalesce(
							watchlist.completedAt,
							sql`excluded.completed_at`,
						),
					},
				});

			return status(201, { status: 201, inserted: rows.length });
		},
		{
			detail: { description: "Bulk add entries/movies to your watch history." },
			body: t.Array(SeedHistory),
			permissions: ["core.read"],
			response: {
				201: t.Object({
					status: t.Literal(201),
					inserted: t.Integer({
						description: "The number of history entry inserted",
					}),
				}),
				422: KError,
			},
		},
	);
