import { Elysia, t } from "elysia";
import { Movie } from "../models/movie";
import { db } from "../db";
import { shows, showTranslations } from "../db/schema/shows";
import { eq, and, sql, or, inArray, getTableColumns } from "drizzle-orm";

const { pk: _, kind, startAir, endAir, ...moviesCol } = getTableColumns(shows);
const { pk, language, ...translationsCol } = getTableColumns(showTranslations);

const findMovie = db
	.select({
		...moviesCol,
		airDate: startAir,
		...translationsCol,
	})
	.from(shows)
	.innerJoin(
		db
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
			.as("t"),
		eq(shows.pk, showTranslations.pk),
	)
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
		error: t.Object({}),
	})
	.guard({
		params: t.Object({
			id: t.String(),
		}),
		response: { 200: "movie", 404: "error" },
	})
	.get("/:id", async ({ params: { id }, error }) => {
		const ret = await findMovie.execute({ id });
		if (ret.length !== 1) return error(404, {});
		return ret[0];
	});
