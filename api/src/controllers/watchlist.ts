import { and, isNotNull, isNull } from "drizzle-orm";
import Elysia, { t } from "elysia";
import { auth, getUserInfo } from "~/auth";
import { shows } from "~/db/schema";
import { KError } from "~/models/error";
import { Show } from "~/models/show";
import {
	AcceptLanguage,
	Filter,
	Page,
	createPage,
	isUuid,
	processLanguages,
} from "~/models/utils";
import { desc } from "~/models/utils/descriptions";
import { getShows, showFilters, showSort, watchStatusQ } from "./shows/logic";

export const watchlistH = new Elysia({ tags: ["profiles"] })
	.use(auth)
	.guard({
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
	})
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
			detail: { description: "Get all movies/series in someone's watchlist" },
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
	);
