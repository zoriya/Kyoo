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
			.onConflictDoUpdate({
				target: shows.slug,
				// we actually don't want to update anything, but we want to return the existing row.
				// using a conflict update with a where false locks the database and ensure we don't have race conditions.
				// it WONT work if we use triggers or need to handle conflicts on multiples collumns
				// see https://stackoverflow.com/questions/34708509/how-to-use-returning-with-on-conflict-in-postgresql for more
				set: { id: sql`excluded.id` },
				setWhere: sql`false`,
			})
			.returning({
				pk: shows.pk,
				id: shows.id,
				slug: shows.slug,
				startAir: shows.startAir,
				// https://stackoverflow.com/questions/39058213/differentiate-inserted-and-updated-rows-in-upsert-using-system-columns/39204667#39204667
				conflict: sql`xmax = 0`.as("conflict"),
			});
		if (ret.conflict) {
			if (getYear(ret.startAir) === getYear(movie.startAir)) {
				return
			}
		}

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

function getYear(date?: string | null) {
	if (!date) return null;
	return new Date(date).getUTCFullYear();
}
