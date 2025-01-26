import { db } from "~/db";
import { entries, entryTranslations } from "~/db/schema";
import { conflictUpdateAllExcept } from "~/db/utils";
import type { Entry, SeedEntry } from "~/models/entry";
import { processOptImage } from "../images";
import { guessNextRefresh } from "../refresh";

type EntryI = typeof entries.$inferInsert;
type EntryTrans = typeof entryTranslations.$inferInsert;

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
	return retEntries;
};
