import { inArray, sql } from "drizzle-orm";
import { t } from "elysia";
import { db } from "~/db";
import {
	type entries,
	entryTranslations,
	entryVideoJointure as evj,
	videos,
} from "~/db/schema";
import { conflictUpdateAllExcept } from "~/db/utils";
import type { SeedMovie } from "~/models/movie";
import { getYear } from "~/utils";
import { insertEntries } from "./insert/entries";
import { insertShow } from "./insert/shows";
import { guessNextRefresh } from "./refresh";

export const SeedMovieResponse = t.Object({
	id: t.String({ format: "uuid" }),
	slug: t.String({ format: "slug", examples: ["bubble"] }),
	videos: t.Array(
		t.Object({ slug: t.String({ format: "slug", examples: ["bubble-v2"] }) }),
	),
});
export type SeedMovieResponse = typeof SeedMovieResponse.static;

export const seedMovie = async (
	seed: SeedMovie,
): Promise<
	| (SeedMovieResponse & { updated: boolean })
	| { status: 409; id: string; slug: string }
	| { status: 422; message: string }
> => {
	if (seed.slug === "random") {
		if (!seed.airDate) {
			return {
				status: 422,
				message: "`random` is a reserved slug. Use something else.",
			};
		}
		seed.slug = `random-${getYear(seed.airDate)}`;
	}

	const { translations, videos: vids, ...bMovie } = seed;
	const nextRefresh = guessNextRefresh(bMovie.airDate ?? new Date());

	const show = await insertShow(
		{
			kind: "movie",
			startAir: bMovie.airDate,
			nextRefresh,
			...bMovie,
		},
		translations,
	);
	if ("status" in show) return show;

	// even if never shown to the user, a movie still has an entry.
	const [entry] = await insertEntries(show, [
		{
			kind: "movie",
			order: 1,
			nextRefresh,
			...bMovie,
		},
	]);

	let retVideos: { slug: string }[] = [];
	if (vids) {
		retVideos = await db
			.insert(evj)
			.select(
				db
					.select({
						entry: sql<number>`${show.entry}`.as("entry"),
						video: videos.pk,
						// TODO: do not add rendering if all videos of the entry have the same rendering
						slug: sql<string>`
								concat(
									${show.slug}::text,
									case when ${videos.part} <> null then concat('-p', ${videos.part}) else '' end,
									case when ${videos.version} <> 1 then concat('-v', ${videos.version}) else '' end
								)
							`.as("slug"),
						// case when (select count(1) from ${evj} where ${evj.entry} = ${ret.entry}) <> 0 then concat('-', ${videos.rendering}) else '' end
					})
					.from(videos)
					.where(inArray(videos.id, vids)),
			)
			.onConflictDoNothing()
			.returning({ slug: evj.slug });
	}

	return {
		updated: show.updated,
		id: show.id,
		slug: show.slug,
		videos: retVideos,
	};
};
