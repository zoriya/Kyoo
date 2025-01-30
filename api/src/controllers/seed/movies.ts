import { t } from "elysia";
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

	const { translations, videos, ...bMovie } = seed;
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
			...bMovie,
			kind: "movie",
			order: 1,
			thumbnail: (bMovie.originalLanguage
				? translations[bMovie.originalLanguage]
				: Object.values(translations)[0]
			)?.thumbnail,
			translations,
			videos,
		},
	]);

	return {
		updated: show.updated,
		id: show.id,
		slug: show.slug,
		videos: entry.videos,
	};
};
