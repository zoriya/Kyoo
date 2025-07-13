import { db } from "~/db";
import { seasons, seasonTranslations } from "~/db/schema";
import { conflictUpdateAllExcept } from "~/db/utils";
import type { SeedSeason } from "~/models/season";
import { enqueueOptImage } from "../images";
import { guessNextRefresh } from "../refresh";

type SeasonI = typeof seasons.$inferInsert;
type SeasonTransI = typeof seasonTranslations.$inferInsert;

export const insertSeasons = async (
	show: { pk: number; slug: string },
	items: SeedSeason[],
) => {
	if (!items.length) return [];

	return db.transaction(async (tx) => {
		const vals: SeasonI[] = items.map((x) => {
			const { translations, ...season } = x;
			return {
				...season,
				showPk: show.pk,
				slug:
					season.seasonNumber === 0
						? `${show.slug}-specials`
						: `${show.slug}-s${season.seasonNumber}`,
				nextRefresh: guessNextRefresh(season.startAir ?? new Date()),
			};
		});
		const ret = await tx
			.insert(seasons)
			.values(vals)
			.onConflictDoUpdate({
				target: seasons.slug,
				set: conflictUpdateAllExcept(seasons, [
					"pk",
					"showPk",
					"id",
					"slug",
					"createdAt",
				]),
			})
			.returning({ pk: seasons.pk, id: seasons.id, slug: seasons.slug });

		const trans: SeasonTransI[] = (
			await Promise.all(
				items.map(
					async (seed, i) =>
						await Promise.all(
							Object.entries(seed.translations).map(async ([lang, tr]) => ({
								// assumes ret is ordered like items.
								pk: ret[i].pk,
								language: lang,
								...tr,
								poster: await enqueueOptImage(tx, {
									url: tr.poster,
									column: seasonTranslations.poster,
								}),
								thumbnail: await enqueueOptImage(tx, {
									url: tr.thumbnail,
									column: seasonTranslations.thumbnail,
								}),
								banner: await enqueueOptImage(tx, {
									url: tr.banner,
									column: seasonTranslations.banner,
								}),
							})),
						),
				),
			)
		).flat();
		await tx
			.insert(seasonTranslations)
			.values(trans)
			.onConflictDoUpdate({
				target: [seasonTranslations.pk, seasonTranslations.language],
				set: conflictUpdateAllExcept(seasonTranslations, ["pk", "language"]),
			});

		return ret;
	});
};
