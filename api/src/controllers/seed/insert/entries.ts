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
	const vals = await Promise.all(
		items.map(async (seed) => {
			const { translations, videos, ...entry } = seed;
			return {
				entry: {
					...entry,
					showPk: show.pk,
					slug: generateSlug(show.slug, seed),
					thumbnails: await processOptImage(seed.thumbnail),
					nextRefresh: guessNextRefresh(entry.airDate ?? new Date()),
				} satisfies EntryI,
				translations: (await Promise.all(
					Object.entries(translations).map(async ([lang, tr]) => ({
						...tr,
						language: lang,
						poster:
							seed.kind === "movie"
								? await processOptImage(tr.poster)
								: undefined,
					})),
				)) satisfies Omit<EntryTrans, "pk">[],
				videos,
			};
		}),
	);

	return await db.transaction(async (tx) => {
		const ret = await tx
			.insert(entries)
			.values(vals.map((x) => x.entry))
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
			.returning({ pk: entries.pk });

		await tx
			.insert(entryTranslations)
			.values(
				vals.map((x, i) =>
					x.translations.map((tr) => ({ ...tr, pk: ret[i].pk })),
				),
			)
			.onConflictDoUpdate({
				target: [entryTranslations.pk, entryTranslations.language],
				set: conflictUpdateAllExcept(entryTranslations, ["pk", "language"]),
			});

		return { ...ret, entry: entry.pk };
	});
};
