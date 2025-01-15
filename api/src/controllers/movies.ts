import { and, eq, sql } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { KError } from "~/models/error";
import { comment } from "~/utils";
import { db } from "../db";
import { shows, showTranslations } from "../db/schema/shows";
import { getColumns } from "../db/schema/utils";
import { bubble } from "../models/examples";
import { Movie, MovieStatus, MovieTranslation } from "../models/movie";
import {
	Filter,
	type Image,
	Sort,
	type FilterDef,
	Genre,
	isUuid,
	keysetPaginate,
	Page,
	processLanguages,
	createPage,
} from "~/models/utils";

// drizzle is bugged and doesn't allow js arrays to be used in raw sql.
export function sqlarr(array: unknown[]) {
	return `{${array.map((item) => `"${item}"`).join(",")}}`;
}

const getTranslationQuery = (languages: string[], forceFallback = false) => {
	const fallback = forceFallback || languages.includes("*");
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

// we keep the pk for after handling. it will be removed by elysia's validators after.
const { kind, startAir, endAir, ...moviesCol } = getColumns(shows);

const movieFilters: FilterDef = {
	genres: {
		column: shows.genres,
		type: "enum",
		values: Genre.enum,
		isArray: true,
	},
	rating: { column: shows.rating, type: "int" },
	status: { column: shows.status, type: "enum", values: MovieStatus.enum },
	runtime: { column: shows.runtime, type: "float" },
	airDate: { column: shows.startAir, type: "date" },
	originalLanguage: { column: shows.originalLanguage, type: "string" },
};

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
				});
			}
			if (!ret.translation) {
				return error(422, {
					status: 422,
					message: "Accept-Language header could not be satisfied.",
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
						This follows the [Accept-Language offical specification](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Accept-Language).
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
						unavailable.) Try with another languages or add * to the list of languages
						to fallback to any language.
					`,
					examples: [
						{
							status: 422,
							message: "Accept-Language header could not be satisfied.",
						},
					],
				},
			},
		},
	)
	.get(
		"random",
		async ({ error, redirect }) => {
			const [movie] = await db
				.select({ id: shows.id })
				.from(shows)
				.where(eq(shows.kind, "movie"))
				.orderBy(sql`random()`)
				.limit(1);
			if (!movie)
				return error(404, {
					status: 404,
					message: "No movies in the database",
				});
			return redirect(`/movies/${movie.id}`);
		},
		{
			detail: {
				description: "Get a random movie",
			},
			response: {
				302: t.Void({
					description:
						"Redirected to the [/movies/{id}](#tag/movies/GET/movies/{id}) route.",
				}),
				404: {
					...KError,
					description: "No movie found with the given id or slug.",
					examples: [
						{ status: 404, message: "Movie not found", details: undefined },
					],
				},
			},
		},
	)
	.get(
		"",
		async ({
			query: { limit, after, sort, filter, preferOriginal },
			headers: { "accept-language": languages },
			request: { url },
		}) => {
			const langs = processLanguages(languages);

			const transQ = db
				.selectDistinctOn([showTranslations.pk])
				.from(showTranslations)
				.orderBy(
					showTranslations.pk,
					sql`array_position(${sqlarr(langs)}, ${showTranslations.language})`,
				)
				.as("t");
			const { pk, poster, thumbnail, banner, logo, ...transCol } =
				getColumns(transQ);

			const items = await db
				.select({
					...moviesCol,
					...transCol,
					status: sql<MovieStatus>`${moviesCol.status}`,
					airDate: startAir,
					poster: sql<Image>`coalese(${showTranslations.poster}, ${poster})`,
					thumbnail: sql<Image>`coalese(${showTranslations.thumbnail}, ${thumbnail})`,
					banner: sql<Image>`coalese(${showTranslations.banner}, ${banner})`,
					logo: sql<Image>`coalese(${showTranslations.logo}, ${logo})`,
				})
				.from(shows)
				.innerJoin(transQ, eq(shows.pk, transQ.pk))
				.leftJoin(
					showTranslations,
					and(
						eq(shows.pk, showTranslations.pk),
						eq(showTranslations.language, shows.originalLanguage),
						// TODO: check user's settings before fallbacking to false.
						sql`coalese(${preferOriginal}, false)`,
					),
				)
				.where(and(filter, keysetPaginate({ table: shows, after, sort })))
				.orderBy(
					...(sort.random
						? [sql`md5(${sort.random.seed} || ${shows.pk})`]
						: []),
					...sort.sort.map((x) =>
						x.desc ? sql`${shows[x.key]} desc nulls last` : shows[x.key],
					),
					shows.pk,
				)
				.limit(limit);

			return createPage(items, { url, sort, limit });
		},
		{
			detail: { description: "Get all movies" },
			query: t.Object({
				sort: Sort(["slug", "rating", "airDate", "createdAt", "nextRefresh"], {
					remap: { airDate: "startAir" },
					default: ["slug"],
					description: "How to sort the query",
				}),
				filter: t.Optional(Filter({ def: movieFilters })),
				limit: t.Integer({
					minimum: 1,
					maximum: 250,
					default: 50,
					description: "Max page size.",
				}),
				after: t.Optional(
					t.String({
						description: comment`
							Id of the cursor in the pagination.
							You can ignore this and only use the prev/next field in the response.
						`,
					}),
				),
				preferOriginal: t.Optional(t.Boolean()),
			}),
			headers: t.Object({
				"accept-language": t.String({
					default: "*",
					example: "en-us, ja;q=0.5",
					description: comment`
						List of languages you want the data in.
						This follows the [Accept-Language offical specification](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Accept-Language).

						In this request, * is always implied (if no language could satisfy the request, kyoo will use any language available.)
					`,
				}),
			}),
			response: {
				200: Page(Movie, {
					description: "Paginated list of movies that match filters.",
				}),
				422: {
					...KError,
					description: "Invalid query parameters.",
					examples: [
						{
							status: 422,
							message:
								"Invalid property: slug. Expected one of genres, rating, status, runtime, airDate, originalLanguage.",
							details: {
								in: "slug eq bubble",
							},
						},
					],
				},
			},
		},
	);
