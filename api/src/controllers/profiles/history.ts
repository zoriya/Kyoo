import { and, isNotNull, ne } from "drizzle-orm";
import Elysia, { t } from "elysia";
import { auth, getUserInfo } from "~/auth";
import { entries } from "~/db/schema";
import { Entry } from "~/models/entry";
import { KError } from "~/models/error";
import {
	AcceptLanguage,
	Filter,
	Page,
	createPage,
	processLanguages,
} from "~/models/utils";
import { desc } from "~/models/utils/descriptions";
import {
	entryFilters,
	entryProgressQ,
	entrySort,
	getEntries,
} from "../entries";

export const historyH = new Elysia({ tags: ["profiles"] }).use(auth).guard(
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
);
