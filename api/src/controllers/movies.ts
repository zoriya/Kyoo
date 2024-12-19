import { and, desc, eq, sql } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { KError } from "~/models/error";
import { isUuid, processLanguages } from "~/models/utils";
import { comment, RemovePrefix } from "~/utils";
import { db } from "../db";
import { shows, showTranslations } from "../db/schema/shows";
import { getColumns } from "../db/schema/utils";
import { bubble } from "../models/examples";
import { Movie, type MovieStatus, MovieTranslation } from "../models/movie";
import { Page } from "~/models/utils/page";

// drizzle is bugged and doesn't allow js arrays to be used in raw sql.
export function sqlarr(array: unknown[]) {
	return `{${array.map((item) => `"${item}"`).join(",")}}`;
}

const getTranslationQuery = (languages: string[]) => {
	const fallback = languages.includes("*");
	const query = db
		.selectDistinctOn([showTranslations.pk])
		.from(showTranslations)
		.where(
			fallback
				? undefined
				: eq(showTranslations.language, sql`any(${sqlarr(languages)})`),
		)
		.orderBy(
			showTranslations.pk,
			sql`array_position(${sqlarr(languages)}, ${showTranslations.language})`,
		)
		.as("t");

	const { pk, ...col } = getColumns(query);
	return [query, col] as const;
};

const { pk: _, kind, startAir, endAir, ...moviesCol } = getColumns(shows);

export const movies = new Elysia({ prefix: "/movies", tags: ["movies"] })
	.model({
		movie: Movie,
		"movie-translation": MovieTranslation,
	})
	.get(
		"/:id",
		async ({
			params: { id },
			headers: { "accept-language": languages },
			error,
			set,
		}) => {
			const langs = processLanguages(languages);
			const [transQ, transCol] = getTranslationQuery(langs);

			const idFilter = isUuid(id) ? eq(shows.id, id) : eq(shows.slug, id);

			const [ret] = await db
				.select({
					...moviesCol,
					status: sql<MovieStatus>`${moviesCol.status}`,
					airDate: startAir,
					translation: transCol,
				})
				.from(shows)
				.leftJoin(transQ, eq(shows.pk, transQ.pk))
				.where(and(eq(shows.kind, "movie"), idFilter))
				.limit(1);

			if (!ret) {
				return error(404, {
					status: 404,
					message: "Movie not found",
					details: undefined,
				});
			}
			if (!ret.translation) {
				return error(422, {
					status: 422,
					message: "Accept-Language header could not be satisfied.",
					details: undefined,
				});
			}
			set.headers["content-language"] = ret.translation.language;
			return { ...ret, ...ret.translation };
		},
		{
			detail: {
				description: "Get a movie by id or slug",
			},
			params: t.Object({
				id: t.String({
					description: "The id or slug of the movie to retrieve.",
					example: bubble.slug,
				}),
			}),
			headers: t.Object({
				"accept-language": t.String({
					default: "*",
					example: "en-us, ja;q=0.5",
					description: comment`
						List of languages you want the data in.
						This follows the Accept-Language offical specification
						(https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Accept-Language).
					`,
				}),
			}),
			response: {
				200: { ...Movie, description: "Found" },
				404: {
					...KError,
					description: "No movie found with the given id or slug.",
					examples: [
						{ status: 404, message: "Movie not found", details: undefined },
					],
				},
				422: {
					...KError,
					description: comment`
						The Accept-Language header can't be satisfied (all languages listed are
						unavailable). Try with another languages or add * to the list of languages
						to fallback to any language.
					`,
					examples: [
						{
							status: 422,
							message: "Accept-Language header could not be satisfied.",
							details: undefined,
						},
					],
				},
			},
		},
	)
	.get(
		"",
		async ({
			query: { limit, after, sort },
			headers: { "accept-language": languages },
		}) => {
			const langs = processLanguages(languages);
			const [transQ, transCol] = getTranslationQuery(langs);
			const order = sort.map((x) => {
				const desc = x[0] === "-";
				const key = (desc ? x.substring(1) : x) as RemovePrefix<typeof x, "-">;
				if (key === "airDate") return { key: "startAir" as const, desc };
				return { key, desc };
			});

			const items = await db
				.select({
					...moviesCol,
					...transCol,
					status: sql<MovieStatus>`${moviesCol.status}`,
					airDate: startAir,
				})
				.from(shows)
				.innerJoin(transQ, eq(shows.pk, transQ.pk))
				.orderBy(
					...order.map((x) => (x.desc ? desc(shows[x.key]) : shows[x.key])),
					shows.pk,
				)
				.limit(limit);

			return { items, next: "", prev: "", this: "" };
		},
		{
			detail: { description: "Get all movies" },
			query: t.Object({
				sort: t.Array(
					t.UnionEnum([
						"slug",
						"-slug",
						"rating",
						"-rating",
						"airDate",
						"-airDate",
						"createdAt",
						"-createdAt",
						"nextRefresh",
						"-nextRefresh",
					]),
					// TODO: support explode: true (allow sort=slug,-createdAt). needs a pr to elysia
					{ explode: false, default: ["slug"] },
				),
				limit: t.Integer({
					minimum: 1,
					maximum: 250,
					default: 50,
					description: "Max page size.",
				}),
				after: t.Optional(
					t.String({
						format: "uuid",
						description: comment`
							Id of the cursor in the pagination.
							You can ignore this and only use the prev/next field in the response.
						`,
					}),
				),
			}),
			headers: t.Object({
				"accept-language": t.String({
					default: "*",
					example: "en-us, ja;q=0.5",
					description: comment`
						List of languages you want the data in.
						This follows the Accept-Language offical specification
						(https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Accept-Language).

						In this request, * is always implied (if no language could satisfy the request, kyoo will use any language available).
					`,
				}),
			}),
			// response: {
			// 	200: Page(Movie, {
			// 		description: "Paginated list of movies that match filters.",
			// 	}),
			// 	422: {
			// 		...KError,
			// 		description: "Invalid query parameters.",
			// 		examples: [
			// 			{
			// 				status: 422,
			// 				message: "Accept-Language header could not be satisfied.",
			// 				details: undefined,
			// 			},
			// 		],
			// 	},
			// },
		},
	);
