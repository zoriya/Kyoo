import { type SQL, and, eq, exists, sql } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { entries, entryVideoJoin, showTranslations, shows } from "~/db/schema";
import { getColumns, sqlarr } from "~/db/utils";
import { KError } from "~/models/error";
import { bubble } from "~/models/examples";
import {
	FullMovie,
	Movie,
	MovieStatus,
	MovieTranslation,
} from "~/models/movie";
import {
	AcceptLanguage,
	Filter,
	type FilterDef,
	Genre,
	type Image,
	Page,
	Sort,
	createPage,
	isUuid,
	keysetPaginate,
	processLanguages,
	sortToSql,
} from "~/models/utils";
import { desc } from "~/models/utils/descriptions";
import { db } from "../db";

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
	tags: {
		column: sql.raw(`t.${showTranslations.tags.name}`),
		type: "string",
		isArray: true,
	},
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
			query: { preferOriginal, with: relations },
			error,
			set,
		}) => {
			const langs = processLanguages(languages);

			const ret = await db.query.shows.findFirst({
				columns: {
					kind: false,
					startAir: false,
					endAir: false,
				},
				extras: {
					airDate: sql<string>`${shows.startAir}`.as("airDate"),
					status: sql<MovieStatus>`${shows.status}`.as("status"),
					isAvailable: exists(
						db
							.select()
							.from(entries)
							.where(
								and(
									eq(shows.pk, entries.showPk),
									exists(
										db
											.select()
											.from(entryVideoJoin)
											.where(eq(entries.pk, entryVideoJoin.entry)),
									),
								),
							),
					).as("isAvailable") as SQL.Aliased<boolean>,
				},
				where: and(
					eq(shows.kind, "movie"),
					isUuid(id) ? eq(shows.id, id) : eq(shows.slug, id),
				),
				with: {
					selectedTranslation: {
						columns: {
							pk: false,
						},
						where: !langs.includes("*")
							? eq(showTranslations.language, sql`any(${sqlarr(langs)})`)
							: undefined,
						orderBy: [
							sql`array_position(${sqlarr(langs)}, ${showTranslations.language})`,
						],
						limit: 1,
					},
					originalTranslation: {
						columns: {
							poster: true,
							thumbnail: true,
							banner: true,
							logo: true,
						},
						extras: {
							// TODO: also fallback on user settings (that's why i made a select here)
							preferOriginal:
								sql<boolean>`(select coalesce(${preferOriginal ?? null}::boolean, false))`.as(
									"preferOriginal",
								),
						},
					},
					...(relations.includes("translations") && {
						translations: {
							columns: {
								pk: false,
							},
						},
					}),
				},
			});

			if (!ret) {
				return error(404, {
					status: 404,
					message: "Movie not found",
				});
			}
			const translation = ret.selectedTranslation[0];
			if (!translation) {
				return error(422, {
					status: 422,
					message: "Accept-Language header could not be satisfied.",
				});
			}
			set.headers["content-language"] = translation.language;
			const ot = ret.originalTranslation;
			return {
				...ret,
				...translation,
				...(ot?.preferOriginal && {
					...(ot.poster && { poster: ot.poster }),
					...(ot.thumbnail && { thumbnail: ot.thumbnail }),
					...(ot.banner && { banner: ot.banner }),
					...(ot.logo && { logo: ot.logo }),
				}),
				...(ret.translations && {
					translations: Object.fromEntries(
						ret.translations.map(
							({ language, ...translation }) =>
								[language, translation] as const,
						),
					),
				}),
			};
		},
		{
			detail: {
				description: "Get a movie by id or slug",
			},
			params: t.Object({
				id: t.String({
					description: "The id or slug of the movie to retrieve.",
					examples: [bubble.slug],
				}),
			}),
			query: t.Object({
				preferOriginal: t.Optional(
					t.Boolean({ description: desc.preferOriginal }),
				),
				with: t.Array(t.UnionEnum(["translations", "videos"]), {
					default: [],
					description: "Include related resources in the response.",
				}),
			}),
			headers: t.Object({
				"accept-language": AcceptLanguage(),
			}),
			response: {
				200: { ...FullMovie, description: "Found" },
				404: {
					...KError,
					description: "No movie found with the given id or slug.",
				},
				422: KError,
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
				},
			},
		},
	)
	.get(
		"",
		async ({
			query: { limit, after, query, sort, filter, preferOriginal },
			headers: { "accept-language": languages },
			request: { url },
		}) => {
			const langs = processLanguages(languages);

			// we keep the pk for after handling. it will be removed by elysia's validators after.
			const { kind, startAir, endAir, ...moviesCol } = getColumns(shows);

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

			const videoQ = db
				.select({ showPk: entries.showPk })
				.from(entries)
				.where(
					exists(
						db
							.select()
							.from(entryVideoJoin)
							.where(eq(entries.pk, entryVideoJoin.entry)),
					),
				)
				.as("video");

			const items = await db
				.select({
					...moviesCol,
					...transCol,
					status: sql<MovieStatus>`${moviesCol.status}`,
					airDate: startAir,
					poster: sql<Image>`coalesce(${showTranslations.poster}, ${poster})`,
					thumbnail: sql<Image>`coalesce(${showTranslations.thumbnail}, ${thumbnail})`,
					banner: sql<Image>`coalesce(${showTranslations.banner}, ${banner})`,
					logo: sql<Image>`coalesce(${showTranslations.logo}, ${logo})`,
					isAvailable: sql<boolean>`${videoQ.showPk} is not null`.as(
						"isAvailable",
					),
				})
				.from(shows)
				.innerJoin(transQ, eq(shows.pk, transQ.pk))
				.leftJoin(
					showTranslations,
					and(
						eq(shows.pk, showTranslations.pk),
						eq(showTranslations.language, shows.originalLanguage),
						// TODO: check user's settings before fallbacking to false.
						sql`coalesce(${preferOriginal ?? null}::boolean, false)`,
					),
				)
				.leftJoin(videoQ, eq(shows.pk, videoQ.showPk))
				.where(
					and(
						filter,
						query ? sql`${transQ.name} %> ${query}::text` : undefined,
						keysetPaginate({ table: shows, after, sort }),
					),
				)
				.orderBy(
					...(query
						? [sql`word_similarity(${query}::text, ${transQ.name})`]
						: sortToSql(sort, shows)),
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
				}),
				filter: t.Optional(Filter({ def: movieFilters })),
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
			headers: t.Object({
				"accept-language": AcceptLanguage({ autoFallback: true }),
			}),
			response: {
				200: Page(Movie),
				422: KError,
			},
		},
	);
