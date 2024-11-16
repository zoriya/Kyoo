import { Elysia, t } from "elysia";
import { Movie, MovieTranslation } from "../models/movie";
import { db } from "../db";
import { shows, showTranslations } from "../db/schema/shows";
import { eq, and, sql, or, inArray } from "drizzle-orm";
import { getColumns } from "../db/schema/utils";
import { bubble } from "../models/examples";

const translations = db
	.selectDistinctOn([showTranslations.language])
	.from(showTranslations)
	.where(
		or(
			inArray(showTranslations.language, sql.placeholder("langs")),
			eq(showTranslations.language, shows.originalLanguage),
		),
	)
	.orderBy(
		sql`array_position(${showTranslations.language}, ${sql.placeholder("langs")})`,
	)
	.as("t");

const { pk: _, kind, startAir, endAir, ...moviesCol } = getColumns(shows);
const { pk, language, ...translationsCol } = getColumns(translations);

const findMovie = db
	.select({
		...moviesCol,
		airDate: startAir,
		translations: translationsCol,
	})
	.from(shows)
	.innerJoin(translations, eq(shows.pk, translations.pk))
	.where(
		and(
			eq(shows.kind, "movie"),
			or(
				eq(shows.id, sql.placeholder("id")),
				eq(shows.slug, sql.placeholder("id")),
			),
		),
	)
	.orderBy()
	.limit(1)
	.prepare("findMovie");

export const movies = new Elysia({ prefix: "/movies" })
	.model({
		movie: Movie,
		"movie-translation": MovieTranslation,
		error: t.Object({}),
	})
	.guard({
		params: t.Object({
			id: t.String({
				description: "The id or slug of the movie to retrieve",
				examples: [bubble.slug],
			}),
		}),
		response: { 200: "movie", 404: "error" },
		tags: ["Movies"],
	})
	.get(
		"/:id",
		async ({ params: { id }, error }) => {
			const ret = await findMovie.execute({ id });
			if (ret.length !== 1) return error(404, {});
			return ret[0];
		},
		{
			detail: {
				description: "Get a movie by id or slug",
			},
		},
	);
