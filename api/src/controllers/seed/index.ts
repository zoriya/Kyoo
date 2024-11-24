import Elysia, { t } from "elysia";
import { Movie, SeedMovie } from "~/models/movie";
import { db } from "~/db";
import {
	shows,
	showTranslations,
	entries,
	entryTranslations,
} from "~/db/schema";
import { guessNextRefresh } from "./refresh";
import { processOptImage } from "./images";

type Show = typeof shows.$inferInsert;
type ShowTrans = typeof showTranslations.$inferInsert;
type Entry = typeof entries.$inferInsert;

export const seed = new Elysia()
	.model({
		movie: Movie,
		"seed-movie": SeedMovie,
		error: t.String(),
	})
	.post(
		"/movies",
		async ({ body }) => {
			const { translations, videos, ...bMovie } = body;

			const ret = await db.transaction(async (tx) => {
				const movie: Show = {
					kind: "movie",
					startAir: bMovie.airDate,
					nextRefresh: guessNextRefresh(bMovie.airDate ?? new Date()),
					...bMovie,
				};
				const [ret] = await tx
					.insert(shows)
					.values(movie)
					.returning({ pk: shows.pk, id: shows.id });

				// even if never shown to the user, a movie still has an entry.
				const movieEntry: Entry = { type: "movie", ...bMovie };
				const [entry] = await tx
					.insert(entries)
					.values(movieEntry)
					.returning({ pk: entries.pk });

				const trans: ShowTrans[] = await Promise.all(
					Object.entries(translations).map(async ([lang, tr]) => ({
						pk: ret.pk,
						// TODO: normalize lang or error if invalid
						language: lang,
						...tr,
						poster: await processOptImage(tr.poster),
						thumbnail: await processOptImage(tr.thumbnail),
						logo: await processOptImage(tr.logo),
						banner: await processOptImage(tr.banner),
					})),
				);
				await tx.insert(showTranslations).values(trans);

				const entryTrans = trans.map((x) => ({ ...x, pk: entry.pk }));
				await tx.insert(entryTranslations).values(entryTrans);

				return { ...ret, entry: entry.pk };
			});

			// TODO: insert entry-video links
			// await db.transaction(async tx => {
			// 	await tx.insert(videos).values(videos);
			// });

			return ret.id;
		},
		{
			body: "seed-movie",
			response: { 200: "movie", 400: "error" },
			tags: ["movies"],
		},
	);
