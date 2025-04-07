import { type SQL, and, eq, isNotNull, isNull, sql } from "drizzle-orm";
import Elysia, { t } from "elysia";
import { auth, getUserInfo } from "~/auth";
import { db } from "~/db";
import { profiles, shows } from "~/db/schema";
import { watchlist } from "~/db/schema/watchlist";
import { conflictUpdateAllExcept, getColumns } from "~/db/utils";
import { KError } from "~/models/error";
import { bubble, madeInAbyss } from "~/models/examples";
import { Show } from "~/models/show";
import {
	AcceptLanguage,
	DbMetadata,
	Filter,
	Page,
	createPage,
	isUuid,
	processLanguages,
} from "~/models/utils";
import { desc } from "~/models/utils/descriptions";
import { MovieWatchStatus, SerieWatchStatus } from "~/models/watchlist";
import { getShows, showFilters, showSort, watchStatusQ } from "./shows/logic";

async function setWatchStatus({
	showFilter,
	status,
	userId,
}: {
	showFilter: { id: SQL; kind: "movie" | "serie" };
	status: SerieWatchStatus;
	userId: string;
}) {
	let [profile] = await db
		.select({ pk: profiles.pk })
		.from(profiles)
		.where(eq(profiles.id, userId))
		.limit(1);
	if (!profile) {
		[profile] = await db
			.insert(profiles)
			.values({ id: userId })
			.onConflictDoUpdate({
				// we can't do `onConflictDoNothing` because on race conditions
				// we still want the profile to be returned.
				target: [profiles.id],
				set: { id: sql`excluded.id` },
			})
			.returning({ pk: profiles.pk });
	}

	const showQ = db
		.select({ pk: shows.pk })
		.from(shows)
		.where(and(showFilter.id, eq(shows.kind, showFilter.kind)));

	const [ret] = await db
		.insert(watchlist)
		.values({
			...status,
			profilePk: profile.pk,
			showPk: sql`${showQ}`,
		})
		.onConflictDoUpdate({
			target: [watchlist.profilePk, watchlist.showPk],
			set: {
				...conflictUpdateAllExcept(watchlist, [
					"profilePk",
					"showPk",
					"createdAt",
					"seenCount",
				]),
				// do not reset movie's progress during drop
				...(showFilter.kind === "movie" && status.status !== "dropped"
					? { seenCount: sql`excluded.seen_count` }
					: {}),
			},
		})
		.returning({
			...getColumns(watchlist),
			percent: sql`${watchlist.seenCount}`.as("percent"),
		});
	return ret;
}

export const watchlistH = new Elysia({ tags: ["profiles"] })
	.use(auth)
	.guard(
		{
			query: t.Object({
				sort: showSort,
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
						jwt: { sub },
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
							preferOriginal,
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
							200: Page(Show),
							422: KError,
						},
					},
				)
				.get(
					"/profiles/:id/watchlist",
					async ({
						params: { id },
						query: { limit, after, query, sort, filter, preferOriginal },
						headers: { "accept-language": languages, authorization },
						request: { url },
						error,
					}) => {
						const uInfo = await getUserInfo(id, { authorization });

						if ("status" in uInfo) return error(uInfo.status as 404, uInfo);

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
							preferOriginal,
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
							200: Page(Show),
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
		async ({ params: { id }, body, jwt: { sub } }) => {
			return await setWatchStatus({
				showFilter: {
					kind: "serie",
					id: isUuid(id) ? eq(shows.id, id) : eq(shows.slug, id),
				},
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
			body: SerieWatchStatus,
			response: {
				200: t.Union([SerieWatchStatus, DbMetadata]),
			},
			permissions: ["core.read"],
		},
	)
	.post(
		"/movies/:id/watchstatus",
		async ({ params: { id }, body, jwt: { sub } }) => {
			return await setWatchStatus({
				showFilter: {
					kind: "movie",
					id: isUuid(id) ? eq(shows.id, id) : eq(shows.slug, id),
				},
				userId: sub,
				status: {
					...body,
					startedAt: body.completedAt,
					// for movies, watch-percent is stored in `seenCount`.
					seenCount: body.status === "completed" ? 100 : 0,
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
				200: t.Union([MovieWatchStatus, DbMetadata]),
			},
			permissions: ["core.read"],
		},
	);
