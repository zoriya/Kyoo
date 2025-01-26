import { eq, sql } from "drizzle-orm";
import { db } from "~/db";
import {
	entries,
	entryTranslations,
	entryVideoJoint as entryVideoJoin,
	videos,
} from "~/db/schema";
import { conflictUpdateAllExcept } from "~/db/utils";
import type { SeedEntry } from "~/models/entry";
import { processOptImage } from "../images";
import { guessNextRefresh } from "../refresh";

const generateSlug = (showSlug: string, entry: SeedEntry): string => {
	switch (entry.kind) {
		case "episode":
			return `${showSlug}-s${entry.seasonNumber}e${entry.episodeNumber}`;
		case "special":
			return `${showSlug}-sp${entry.number}`;
		case "movie":
			return entry.order === 1 ? showSlug : `${showSlug}-${entry.order}`;
	}
};

export const insertEntries = async (
	show: { pk: number; slug: string },
	items: SeedEntry[],
) => {
	const retEntries = await db.transaction(async (tx) => {
		const vals = items.map((seed) => {
			const { translations, videos, ...entry } = seed;
			return {
				...entry,
				showPk: show.pk,
				slug: generateSlug(show.slug, seed),
				thumbnails: processOptImage(seed.thumbnail),
				nextRefresh: guessNextRefresh(entry.airDate ?? new Date()),
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

		const trans = items.flatMap((seed, i) =>
			Object.entries(seed.translations).map(([lang, tr]) => ({
				// assumes ret is ordered like items.
				pk: ret[i].pk,
				language: lang,
				...tr,
			})),
		);
		await tx
			.insert(entryTranslations)
			.values(trans)
			.onConflictDoUpdate({
				target: [entryTranslations.pk, entryTranslations.language],
				set: conflictUpdateAllExcept(entryTranslations, ["pk", "language"]),
			});

		return ret;
	});

	const vids = items.flatMap(
		(seed, i) =>
			seed.videos?.map((x) => ({ videoId: x, entryPk: retEntries[i].pk })) ??
			[],
	);

	if (vids.length === 0)
		return retEntries.map((x) => ({ id: x.id, slug: x.slug, videos: [] }));

	const hasRenderingQ = db
		.select()
		.from(entryVideoJoin)
		.where(eq(entryVideoJoin.entry, sql`vids.entryPk`));

	const retVideos = await db
		.insert(entryVideoJoin)
		.select(
			db
				.select({
					entry: sql<number>`vids.entryPk`.as("entry"),
					video: videos.pk,
					slug: sql<string>`
						concat(
							${show.slug}::text,
							case when ${videos.part} <> null then ('-p' || ${videos.part}) else '' end,
							case when ${videos.version} <> 1 then ('-v' || ${videos.version}) else '' end,
							case when exists(${hasRenderingQ}) then concat('-', ${videos.rendering}) else '' end
						)
					`.as("slug"),
				})
				.from(sql`values(${vids}) as vids(videoId, entryPk)`)
				.innerJoin(videos, eq(videos.id, sql`vids.videoId`)),
		)
		.onConflictDoNothing()
		.returning({ slug: entryVideoJoin.slug, entryPk: sql`vids.entryPk` });

	return retEntries.map((entry) => ({
		id: entry.id,
		slug: entry.slug,
		videos: retVideos.filter((x) => x.entryPk === entry.pk),
	}));
};
