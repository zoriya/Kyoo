import { type SQL, and, eq, isNotNull, isNull, sql } from "drizzle-orm";
import Elysia, { t } from "elysia";
import { auth, getUserInfo } from "~/auth";
import { db } from "~/db";
import { profiles, shows } from "~/db/schema";
import { watchlist } from "~/db/schema/watchlist";
import { conflictUpdateAllExcept } from "~/db/utils";
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
	const profileQ = db
		.select({ pk: profiles.pk })
		.from(profiles)
		.where(eq(profiles.id, userId))
		.as("profileQ");
	const showQ = db
		.select({ pk: shows.pk })
		.from(shows)
		.where(and(showFilter.id, eq(shows.kind, showFilter.kind)))
		.as("showQ");

	return await db
		.insert(watchlist)
		.values({
			...status,
			profilePk: sql`${profileQ}`,
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
		.returning();
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
			response: {
				200: Page(Show),
				422: KError,
			},
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
					},
				)
				.get(
					"/profiles/:id/watchlist",
					async ({
						params: { id },
						query: { limit, after, query, sort, filter, preferOriginal },
						headers: { "accept-language": languages, authorization },
						request: { url },
					}) => {
						if (!isUuid(id)) {
							const uInfo = await getUserInfo(id, { authorization });
							id = uInfo.id;
						}

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
							userId: id,
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
				201: t.Union([SerieWatchStatus, DbMetadata]),
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
				201: t.Union([MovieWatchStatus, DbMetadata]),
			},
			permissions: ["core.read"],
		},
	);
