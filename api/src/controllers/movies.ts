import { Elysia, t } from "elysia";
import { Movie, MovieTranslation } from "../models/movie";
import { db } from "../db";
import { shows, showTranslations } from "../db/schema/shows";
import { eq, and, sql, or } from "drizzle-orm";
import { getColumns } from "../db/schema/utils";
import { bubble } from "../models/examples";
import { comment } from "~/utils";
import { processLanguages } from "~/models/utils";

const translations = db
	.selectDistinctOn([showTranslations.pk])
	.from(showTranslations)
	// .where(
		// or(
			// eq(showTranslations.language, sql`any(${sql.placeholder("langs")})`),
			// eq(showTranslations.language, shows.originalLanguage),
		// ),
	// )
	.orderBy(
		showTranslations.pk,
		sql`array_position(${sql.placeholder("langs")}, ${showTranslations.language})`,
	)
	.as("t");

const { pk: _, kind, startAir, endAir, ...moviesCol } = getColumns(shows);
const { pk, language, ...translationsCol } = getColumns(translations);

const findMovie = db
	.select({
		...moviesCol,
		...translationsCol,
		airDate: startAir,
	})
	.from(shows)
	.innerJoin(translations, eq(shows.pk, translations.pk))
	.where(
		and(
			eq(shows.kind, "movie"),
			// or(
			// 	eq(shows.id, sql.placeholder("id")),
				eq(shows.slug, sql.placeholder("id")),
			// ),
		),
	)
	// .orderBy()
	.limit(1)
	.prepare("findMovie");

export const movies = new Elysia({ prefix: "/movies", tags: ["movies"] })
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
		headers: t.Object({
			"Accept-Language": t.String({
				default: "*",
				examples: "en-us, ja;q=0.5",
				description: comment`
					List of languages you want the data in.
					This follows the Accept-Language offical specification
					(https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Accept-Language)
				`,
			}),
		}),
		response: { 200: "movie", 404: "error" },
	})
	.get(
		"/:id",
		async ({
			params: { id },
			headers: { "Accept-Language": languages },
			error,
		}) => {
			const langs = processLanguages(languages);
		console.log(langs);
			console.log(findMovie.getQuery());
			const ret = await findMovie.execute({ id, langs });
			console.log(ret);
			if (ret.length !== 1) return error(404, {});
			return ret[0];
		},
		{
			detail: {
				description: "Get a movie by id or slug",
			},
		},
	)
