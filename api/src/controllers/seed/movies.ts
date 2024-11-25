import { db } from "~/db";
import {
	entries,
	entryTranslations,
	shows,
	showTranslations,
} from "~/db/schema";
import type { SeedMovie } from "~/models/movie";
import { processOptImage } from "./images";
import { guessNextRefresh } from "./refresh";

type Show = typeof shows.$inferInsert;
type ShowTrans = typeof showTranslations.$inferInsert;
type Entry = typeof entries.$inferInsert;

export const seedMovie = async (seed: SeedMovie) => {
	const { translations, videos, ...bMovie } = seed;

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
};
