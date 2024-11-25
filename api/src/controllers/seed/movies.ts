import { db } from "~/db";
import {
	entries,
	entryTranslations,
	entryVideoJointure,
	shows,
	showTranslations,
	videos,
} from "~/db/schema";
import type { SeedMovie } from "~/models/movie";
import { processOptImage } from "./images";
import { guessNextRefresh } from "./refresh";
import { inArray, sql } from "drizzle-orm";
import { t } from "elysia";
import { Resource } from "~/models/utils";

type Show = typeof shows.$inferInsert;
type ShowTrans = typeof showTranslations.$inferInsert;
type Entry = typeof entries.$inferInsert;

export const SeedMovieResponse = t.Intersect([
	Resource,
	t.Object({ videos: t.Array(Resource) }),
]);
export type SeedMovieResponse = typeof SeedMovieResponse.static;

export const seedMovie = async (
	seed: SeedMovie,
): Promise<SeedMovieResponse> => {
	const { translations, videos: vids, ...bMovie } = seed;

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
			.returning({ pk: shows.pk, id: shows.id, slug: shows.slug });

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

	let retVideos: { id: string; slug: string }[] = [];
	if (vids) {
		retVideos = await db.transaction(async (tx) => {
			return await tx
				.insert(entryVideoJointure)
				.select(
					tx
						.select({
							entry: sql<number>`${ret.entry}`.as("entry"),
							video: videos.pk,
							// TODO: do not add rendering if all videos of the entry have the same rendering
							slug: sql<string>`
								concat(
									${entries.slug},
									case when ${videos.part} <> null then concat("-p", ${videos.part}) else "" end,
									case when ${videos.version} <> 1 then concat("-v", ${videos.version}) else "" end,
									"-", ${videos.rendering}
								)
							`.as("slug"),
						})
						.from(videos)
						.where(inArray(videos.id, vids)),
				)
				.onConflictDoNothing()
				.returning({ id: videos.id, slug: entryVideoJointure.slug });
		});
	}

	return {
		id: ret.id,
		slug: ret.slug,
		videos: retVideos,
	};
};
