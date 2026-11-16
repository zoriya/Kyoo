import { t } from "elysia";
import { db } from "~/db";
import type { SeedMovie } from "~/models/movie";
import { getYear } from "~/utils";
import { broadcast } from "~/websockets";
import { insertCollection } from "./insert/collection";
import { insertEntries } from "./insert/entries";
import { insertShow } from "./insert/shows";
import { insertStaff } from "./insert/staff";
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
	staff: t.Array(
		t.Object({
			id: t.String({ format: "uuid" }),
			slug: t.String({ format: "slug", examples: ["hiroyuki-sawano"] }),
		}),
	),
});
export type SeedMovieResponse = typeof SeedMovieResponse.static;

export const seedMovie = async (
	seed: Omit<SeedMovie, "slug"> & { slug?: string },
	// update the movie with this id instead of creating a new one
	id?: string,
): Promise<
	| (SeedMovieResponse & {
			updated: boolean;
			collection: { id: string; slug: string; updated: boolean } | null;
	  })
	| { status: 409; id: string; slug: string }
	| { status: 409; message: string; details?: { id: string; slug: string } }
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

	const { translations, videos, collection, studios, staff, ...movie } = seed;
	const nextRefresh = guessNextRefresh({ ...seed, kind: "movie" });
	const ori = translations[movie.originalLanguage];
	const original = ori
		? {
				...ori,
				latinName: ori.latinName ?? null,
				language: movie.originalLanguage,
			}
		: {
				name: null,
				latinName: null,
				language: movie.originalLanguage,
			};

	const col = await insertCollection(
		collection,
		{
			kind: "movie",
			nextRefresh,
			...seed,
		},
		original,
	);

	const show = await insertShow(
		{
			kind: "movie",
			startAir: movie.airDate,
			nextRefresh,
			collectionPk: col?.pk,
			entriesCount: 1,
			id,
			...movie,
		},
		original,
		translations,
	);
	if ("status" in show) return show;

	// even if never shown to the user, a movie still has an entry.
	const [entry] = await insertEntries(show, [
		{
			...movie,
			kind: "movie",
			content: "story",
			order: 1,
			thumbnail: (movie.originalLanguage
				? translations[movie.originalLanguage]
				: Object.values(translations)[0]
			)?.thumbnail,
			translations,
			videos,
		},
	]);

	const retStudios = await insertStudios(studios, show.pk);
	const retStaff = await insertStaff(staff, show.pk);

	await broadcast(db, [
		{
			action: show.updated ? "updated" : "created",
			kind: "movie",
			id: show.id,
			slug: show.slug,
		},
		...(col
			? [
					{
						action: col.updated ? ("updated" as const) : ("created" as const),
						kind: "collection" as const,
						id: col.id,
						slug: col.slug,
					},
				]
			: []),
	]);

	return {
		updated: show.updated,
		id: show.id,
		slug: show.slug,
		videos: entry.videos,
		collection: col,
		studios: retStudios,
		staff: retStaff,
	};
};
