import { inArray, sql, eq } from "drizzle-orm";
import { t } from "elysia";
import { db } from "~/db";
import {
	entries,
	entryTranslations,
	entryVideoJointure as evj,
	shows,
	showTranslations,
	videos,
} from "~/db/schema";
import { conflictUpdateAllExcept } from "~/db/schema/utils";
import type { SeedMovie } from "~/models/movie";
import { processOptImage } from "./images";
import { guessNextRefresh } from "./refresh";

type Show = typeof shows.$inferInsert;
type ShowTrans = typeof showTranslations.$inferInsert;
type Entry = typeof entries.$inferInsert;

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
	SeedMovieResponse & { status: "Created" | "OK" | "Conflict" }
> => {
	const { translations, videos: vids, ...bMovie } = seed;

	const ret = await db.transaction(async (tx) => {
		const movie: Show = {
			kind: "movie",
			startAir: bMovie.airDate,
			nextRefresh: guessNextRefresh(bMovie.airDate ?? new Date()),
			...bMovie,
		};

		const insert = () =>
			tx
				.insert(shows)
				.values(movie)
				.onConflictDoUpdate({
					target: shows.slug,
					set: conflictUpdateAllExcept(shows, [
						"pk",
						"id",
						"slug",
						"createdAt",
					]),
					// if year is different, this is not an update but a conflict (ex: dune-1984 vs dune-2021)
					setWhere: sql`date_part('year', ${shows.startAir}) = date_part('year', excluded."start_air")`,
				})
				.returning({
					pk: shows.pk,
					id: shows.id,
					slug: shows.slug,
					// https://stackoverflow.com/questions/39058213/differentiate-inserted-and-updated-rows-in-upsert-using-system-columns/39204667#39204667
					updated: sql<boolean>`(xmax <> 0)`.as("updated"),
				});
		let [ret] = await insert();
		if (!ret) {
			// ret is undefined when the conflict's where return false (meaning we have
			// a conflicting slug but a different air year.
			// try to insert adding the year at the end of the slug.
			if (
				movie.startAir &&
				!movie.slug.endsWith(`${getYear(movie.startAir)}`)
			) {
				movie.slug = `${movie.slug}-${getYear(movie.startAir)}`;
				[ret] = await insert();
			}

			// if at this point ret is still undefined, we could not reconciliate.
			// simply bail and let the caller handle this.
			if (!ret) {
				const [{ id }] = await db
					.select({ id: shows.id })
					.from(shows)
					.where(eq(shows.slug, movie.slug))
					.limit(1);
				return {
					status: "Conflict" as const,
					id,
					slug: movie.slug,
					videos: [],
				};
			}
		}

		// even if never shown to the user, a movie still has an entry.
		const movieEntry: Entry = { type: "movie", ...bMovie };
		const [entry] = await tx
			.insert(entries)
			.values(movieEntry)
			.onConflictDoUpdate({
				target: entries.slug,
				set: conflictUpdateAllExcept(entries, [
					"pk",
					"id",
					"slug",
					"createdAt",
				]),
			})
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
		await tx
			.insert(showTranslations)
			.values(trans)
			.onConflictDoUpdate({
				target: [showTranslations.pk, showTranslations.language],
				set: conflictUpdateAllExcept(showTranslations, ["pk", "language"]),
			});

		const entryTrans = trans.map((x) => ({ ...x, pk: entry.pk }));
		await tx
			.insert(entryTranslations)
			.values(entryTrans)
			.onConflictDoUpdate({
				target: [entryTranslations.pk, entryTranslations.language],
				set: conflictUpdateAllExcept(entryTranslations, ["pk", "language"]),
			});

		return { ...ret, entry: entry.pk };
	});

	if (ret.status === "Conflict") return ret;

	let retVideos: { slug: string }[] = [];
	if (vids) {
		retVideos = await db
			.insert(evj)
			.select(
				db
					.select({
						entry: sql<number>`${ret.entry}`.as("entry"),
						video: videos.pk,
						// TODO: do not add rendering if all videos of the entry have the same rendering
						slug: sql<string>`
								concat(
									${ret.slug}::text,
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
		status: ret.updated ? "Ok" : "Created",
		id: ret.id,
		slug: ret.slug,
		videos: retVideos,
	};
};

function getYear(date: string) {
	return new Date(date).getUTCFullYear();
}
