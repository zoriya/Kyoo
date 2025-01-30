import { type Column, type SQL, eq, sql } from "drizzle-orm";
import { db } from "~/db";
import {
	entries,
	entryTranslations,
	entryVideoJoin,
	videos,
} from "~/db/schema";
import { conflictUpdateAllExcept, values } from "~/db/utils";
import type { SeedEntry as SEntry, SeedExtra as SExtra } from "~/models/entry";
import { processOptImage } from "../images";
import { guessNextRefresh } from "../refresh";

type SeedEntry = SEntry & {
	video?: undefined;
};
type SeedExtra = Omit<SExtra, "kind"> & {
	videos?: undefined;
	translations?: undefined;
	kind: "extra";
	extraKind: SExtra["kind"];
};

type EntryI = typeof entries.$inferInsert;

const generateSlug = (
	showSlug: string,
	entry: SeedEntry | SeedExtra,
): string => {
	switch (entry.kind) {
		case "episode":
			return `${showSlug}-s${entry.seasonNumber}e${entry.episodeNumber}`;
		case "special":
			return `${showSlug}-sp${entry.number}`;
		case "movie":
			if (entry.slug) return entry.slug;
			return entry.order === 1 ? showSlug : `${showSlug}-${entry.order}`;
		case "extra":
			return entry.slug;
	}
};

export const insertEntries = async (
	show: { pk: number; slug: string },
	items: (SeedEntry | SeedExtra)[],
) => {
	if (!items) return [];

	const retEntries = await db.transaction(async (tx) => {
		const vals: EntryI[] = items.map((seed) => {
			const { translations, videos, video, ...entry } = seed;
			return {
				...entry,
				showPk: show.pk,
				slug: generateSlug(show.slug, seed),
				thumbnail: processOptImage(seed.thumbnail),
				nextRefresh:
					entry.kind !== "extra"
						? guessNextRefresh(entry.airDate ?? new Date())
						: guessNextRefresh(new Date()),
				episodeNumber:
					entry.kind === "episode"
						? entry.episodeNumber
						: entry.kind === "special"
							? entry.number
							: undefined,
			};
		});
		const ret = await tx
			.insert(entries)
			.values(vals)
			.onConflictDoUpdate({
				target: entries.slug,
				set: conflictUpdateAllExcept(entries, [
					"pk",
					"showPk",
					"id",
					"slug",
					"createdAt",
				]),
			})
			.returning({ pk: entries.pk, id: entries.id, slug: entries.slug });

		const trans = items.flatMap((seed, i) => {
			if (seed.kind === "extra") {
				return {
					pk: ret[i].pk,
					// yeah we hardcode the language to extra because if we want to support
					// translations one day it won't be awkward
					language: "extra",
					name: seed.name,
					description: null,
				};
			}

			return Object.entries(seed.translations).map(([lang, tr]) => ({
				// assumes ret is ordered like items.
				pk: ret[i].pk,
				language: lang,
				...tr,
			}));
		});
		await tx
			.insert(entryTranslations)
			.values(trans)
			.onConflictDoUpdate({
				target: [entryTranslations.pk, entryTranslations.language],
				set: conflictUpdateAllExcept(entryTranslations, ["pk", "language"]),
			});

		return ret;
	});

	const vids = items.flatMap((seed, i) => {
		if (seed.kind === "extra") {
			return {
				videoId: seed.video,
				entryPk: retEntries[i].pk,
				needRendering: false,
			};
		}
		if (!seed.videos) return [];
		return seed.videos.map((x, j) => ({
			videoId: x,
			entryPk: retEntries[i].pk,
			// The first video should not have a rendering.
			needRendering: j && seed.videos!.length > 1,
		}));
	});

	if (vids.length === 0)
		return retEntries.map((x) => ({ id: x.id, slug: x.slug, videos: [] }));

	const retVideos = await db
		.insert(entryVideoJoin)
		.select(
			db
				.select({
					entry: sql<number>`vids.entryPk::integer`.as("entry"),
					video: sql`${videos.pk}`.as("video"),
					slug: computeVideoSlug(
						sql`${show.slug}::text`,
						sql`vids.needRendering::boolean`,
					),
				})
				.from(values(vids).as("vids"))
				.innerJoin(videos, eq(videos.id, sql`vids.videoId::uuid`)),
		)
		.onConflictDoNothing()
		.returning({
			slug: entryVideoJoin.slug,
			entryPk: entryVideoJoin.entry,
		});

	return retEntries.map((entry) => ({
		id: entry.id,
		slug: entry.slug,
		videos: retVideos.filter((x) => x.entryPk === entry.pk),
	}));
};

export function computeVideoSlug(showSlug: SQL | Column, needsRendering: SQL) {
	return sql<string>`
		concat(
			${showSlug},
			case when ${videos.part} is not null then ('-p' || ${videos.part}) else '' end,
			case when ${videos.version} <> 1 then ('-v' || ${videos.version}) else '' end,
			case when ${needsRendering} then concat('-', ${videos.rendering}) else '' end
		)
	`.as("slug");
}
