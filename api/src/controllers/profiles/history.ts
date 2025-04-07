import { and, eq, isNotNull, ne, not, or, sql } from "drizzle-orm";
import Elysia, { t } from "elysia";
import { auth, getUserInfo } from "~/auth";
import { db } from "~/db";
import { entries, history, profiles, videos } from "~/db/schema";
import { values } from "~/db/utils";
import { Entry } from "~/models/entry";
import { KError } from "~/models/error";
import { SeedHistory } from "~/models/history";
import {
	AcceptLanguage,
	Filter,
	Page,
	createPage,
	isUuid,
	processLanguages,
} from "~/models/utils";
import { desc } from "~/models/utils/descriptions";
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
								ne(entries.kind, "unknown"),
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
						error,
					}) => {
						const uInfo = await getUserInfo(id, { authorization });
						if ("status" in uInfo) return error(uInfo.status as 404, uInfo);

						const langs = processLanguages(languages);
						const items = (await getEntries({
							limit,
							after,
							query,
							sort,
							filter: and(
								isNotNull(entryProgressQ.playedDate),
								ne(entries.kind, "extra"),
								ne(entries.kind, "unknown"),
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
		async ({ body, jwt: { sub }, error }) => {
			const profilePk = await getOrCreateProfile(sub);

			const rows = await db
				.insert(history)
				.select(
					db
						.select({
							profilePk: sql<number>`${profilePk}`,
							entryPk: entries.pk,
							videoPk: videos.pk,
							percent: sql`hist.percent::integer`,
							time: sql`hist.time::integer`,
							playedDate: sql`hist.playedDate::timestamptz`,
						})
						.from(
							values(
								body.map((x) => ({ ...x, entryUseId: isUuid(x.entry) })),
							).as("hist"),
						)
						.innerJoin(
							entries,
							or(
								and(
									sql`hist.entryUseId::boolean`,
									eq(entries.id, sql`hist.entry::uuid`),
								),
								and(
									not(sql`hist.entryUseId::boolean`),
									eq(entries.slug, sql`hist.entry`),
								),
							),
						)
						.leftJoin(videos, eq(videos.id, sql`hist.videoId::uuid`)),
				)
				.returning({ pk: history.pk });
			return error(201, { status: 201, inserted: rows.length });
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
