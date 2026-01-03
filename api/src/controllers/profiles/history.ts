import {
	and,
	count,
	eq,
	exists,
	gt,
	isNotNull,
	lte,
	ne,
	sql,
	TransactionRollbackError,
} from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import Elysia, { t } from "elysia";
import { auth, getUserInfo } from "~/auth";
import { db, type Transaction } from "~/db";
import { entries, history, profiles, shows, videos } from "~/db/schema";
import { watchlist } from "~/db/schema/watchlist";
import { coalesce, sqlarr } from "~/db/utils";
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
import { traverse } from "~/utils";
import {
	entryFilters,
	entryProgressQ,
	entrySort,
	getEntries,
} from "../entries";
import { getOrCreateProfile } from "./profile";

export async function updateProgress(userPk: number, progress: SeedHistory[]) {
	try {
		return await db.transaction(async (tx) => {
			const hist = await updateHistory(tx, userPk, progress);
			if (hist.created.length + hist.updated.length !== progress.length) {
				tx.rollback();
			}
			// only return new and entries whose status has changed.
			// we don't need to update the watchlist every 10s when watching a video.
			await updateWatchlist(tx, userPk, [
				...hist.created,
				...hist.updated.filter((x) => x.percent >= 95),
			]);
			return { status: 201, inserted: hist.created.length } as const;
		});
	} catch (e) {
		if (!(e instanceof TransactionRollbackError)) throw e;
		return {
			status: 404,
			message: "Invalid entry id/slug in progress array",
		} as const;
	}
}

async function updateHistory(
	dbTx: Transaction,
	userPk: number,
	progress: SeedHistory[],
) {
	return dbTx.transaction(async (tx) => {
		// `for("update", { of: history })` will put the `kyoo.history` instead
		// of `history` in the sql and that triggers a sql error.
		const existing = (
			await tx
				.select({ videoId: videos.id })
				.from(history)
				.for("update", { of: sql`history` as any })
				.leftJoin(videos, eq(videos.pk, history.videoPk))
				.where(
					and(
						eq(history.profilePk, userPk),
						lte(sql`now() - ${history.playedDate}`, sql`interval '1 day'`),
					),
				)
		).map((x) => x.videoId);

		const toUpdate = traverse(
			progress.filter((x) => existing.includes(x.videoId)),
		);
		const newEntries = traverse(
			progress
				.filter((x) => !existing.includes(x.videoId))
				.map((x) => ({ ...x, entryUseid: isUuid(x.entry) })),
		);

		const updated =
			toUpdate === null
				? []
				: await tx
						.update(history)
						.set({
							time: sql`hist.ts`,
							percent: sql`hist.percent`,
							playedDate: coalesce(sql`hist.played_date`, sql`now()`),
						})
						.from(sql`unnest(
							${sqlarr(toUpdate.videoId)}::uuid[],
							${sqlarr(toUpdate.time)}::integer[],
							${sqlarr(toUpdate.percent)}::integer[],
							${sqlarr(toUpdate.playedDate)}::timestamp[]
						) as hist(video_id, ts, percent, played_date)`)
						.innerJoin(videos, eq(videos.id, sql`hist.video_id`))
						.where(
							and(
								eq(history.profilePk, userPk),
								eq(history.videoPk, videos.pk),
							),
						)
						.returning({
							entryPk: history.entryPk,
							videoPk: history.videoPk,
							percent: history.percent,
							playedDate: history.playedDate,
						});

		const created =
			newEntries === null
				? []
				: await tx
						.insert(history)
						.select(
							db
								.select({
									profilePk: sql`${userPk}`.as("profilePk"),
									videoPk: videos.pk,
									entryPk: entries.pk,
									percent: sql`hist.percent`.as("percent"),
									time: sql`hist.ts`.as("time"),
									playedDate: coalesce(sql`hist.played_date`, sql`now()`).as(
										"playedDate",
									),
								})
								.from(sql`unnest(
									${sqlarr(newEntries.entry)}::text[],
									${sqlarr(newEntries.entryUseid)}::boolean[],
									${sqlarr(newEntries.videoId)}::uuid[],
									${sqlarr(newEntries.time)}::integer[],
									${sqlarr(newEntries.percent)}::integer[],
									${sqlarr(newEntries.playedDate)}::timestamptz[]
								) as hist(entry, entry_use_id, video_id, ts, percent, played_date)`)
								.innerJoin(
									entries,
									sql`
										case
											when hist.entry_use_id then ${entries.id} = hist.entry::uuid
											else ${entries.slug} = hist.entry
										end
									`,
								)
								.leftJoin(videos, eq(videos.id, sql`hist.video_id`)),
						)
						.returning({
							entryPk: history.entryPk,
							videoPk: history.videoPk,
							percent: history.percent,
							playedDate: history.playedDate,
						});

		return { created, updated };
	});
}

async function updateWatchlist(
	tx: Transaction,
	userPk: number,
	histArr: {
		entryPk: number;
		percent: number;
		playedDate: Date;
	}[],
) {
	if (histArr.length === 0) return;

	const nextEntry = alias(entries, "next_entry");
	const nextEntryQ = tx
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

	const seenCountQ = tx
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
								eq(history.profilePk, userPk),
								eq(history.entryPk, entries.pk),
							),
						),
				),
			),
		);

	const showKindQ = tx
		.select({ k: shows.kind })
		.from(shows)
		.where(eq(shows.pk, sql`excluded.show_pk`));

	const hist = traverse(histArr)!;
	await tx
		.insert(watchlist)
		.select(
			db
				.selectDistinctOn([entries.showPk], {
					profilePk: sql`${userPk}`.as("profilePk"),
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
					startedAt: sql`hist.played_date`.as("startedAt"),
					lastPlayedAt: sql`hist.played_date`.as("lastPlayedAt"),
					completedAt: sql`
						case
							when ${nextEntryQ.pk} is null then hist.played_date
							else null
						end
					`.as("completedAt"),
					// see https://github.com/drizzle-team/drizzle-orm/issues/3608
					updatedAt: sql`now()`.as("updatedAt"),
				})
				.from(sql`unnest(
					${sqlarr(hist.entryPk)}::integer[],
					${sqlarr(hist.percent)}::integer[],
					${sqlarr(hist.playedDate)}::timestamptz[]
				) as hist(entry_pk, percent, played_date)`)
				.innerJoin(entries, eq(entries.pk, sql`hist.entry_pk`))
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
}

// this one is different than the normal progressQ because we want duplicates
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
	.innerJoin(profiles, eq(history.profilePk, profiles.pk))
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
						headers: { "accept-language": languages, ...headers },
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

						return createPage(items, { url, sort, limit, headers });
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

						return createPage(items, { url, sort, limit, headers });
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
			if (!profilePk) {
				return status(401, {
					status: 401,
					message: "Guest don't have history",
				});
			}

			const ret = await updateProgress(profilePk, body);
			return status(ret.status, ret);
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
				401: { ...KError, description: "Non logged users don't have history" },
				404: {
					...KError,
					description: "No entry found with the given id or slug.",
				},
				422: KError,
			},
		},
	);
