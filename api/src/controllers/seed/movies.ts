import { t } from "elysia";
import type { SeedMovie } from "~/models/movie";
import { getYear } from "~/utils";
import { processOptImage } from "./images";
import { insertCollection } from "./insert/collection";
import { insertEntries } from "./insert/entries";
import { insertShow, updateAvailableCount } from "./insert/shows";
import { insertStudios } from "./insert/studios";
import { guessNextRefresh } from "./refresh";

export const SeedMovieResponse = t.Object({
	id: t.String({ format: "uuid" }),
	slug: t.String({ format: "slug", examples: ["bubble"] }),
	videos: t.Array(
		t.Object({ slug: t.String({ format: "slug", examples: ["bubble-v2"] }) }),
	),
	collection: t.Nullable(
		t.Object({
			id: t.String({ format: "uuid" }),
			slug: t.String({ format: "slug", examples: ["sawano-collection"] }),
		}),
	),
	studios: t.Array(
		t.Object({
			id: t.String({ format: "uuid" }),
			slug: t.String({ format: "slug", examples: ["disney"] }),
		}),
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

	const { translations, videos, collection, studios, ...movie } = seed;
	const nextRefresh = guessNextRefresh(movie.airDate ?? new Date());

	const col = await insertCollection(collection, {
		kind: "movie",
		nextRefresh,
		...seed,
	});

	const original = translations[movie.originalLanguage];
	const show = await insertShow(
		{
			kind: "movie",
			startAir: movie.airDate,
			nextRefresh,
			collectionPk: col?.pk,
			entriesCount: 1,
			original: {
				language: movie.originalLanguage,
				name: original.name,
				latinName: original.latinName ?? null,
				poster: processOptImage(original.poster),
				thumbnail: processOptImage(original.thumbnail),
				logo: processOptImage(original.logo),
				banner: processOptImage(original.banner),
			},
			...movie,
		},
		translations,
	);
	if ("status" in show) return show;

	// even if never shown to the user, a movie still has an entry.
	const [entry] = await insertEntries(show, [
		{
			...movie,
			kind: "movie",
			order: 1,
			thumbnail: (movie.originalLanguage
				? translations[movie.originalLanguage]
				: Object.values(translations)[0]
			)?.thumbnail,
			translations,
			videos,
		},
	]);
	await updateAvailableCount([show.pk], false);

	const retStudios = await insertStudios(studios, show.pk);

	return {
		updated: show.updated,
		id: show.id,
		slug: show.slug,
		videos: entry.videos,
		collection: col,
		studios: retStudios,
	};
};
