import { db } from "~/db";
import { seasonTranslations, seasons } from "~/db/schema";
import { conflictUpdateAllExcept } from "~/db/utils";
import type { SeedSeason } from "~/models/season";
import { processOptImage } from "../images";
import { guessNextRefresh } from "../refresh";

type SeasonI = typeof seasons.$inferInsert;
type SeasonTransI = typeof seasonTranslations.$inferInsert;

export const insertSeasons = async (
	show: { pk: number; slug: string },
	items: SeedSeason[],
) => {
	return db.transaction(async (tx) => {
		const vals: SeasonI[] = items.map((x) => {
			const { translations, ...season } = x;
			return {
				...season,
				showPk: show.pk,
				slug: `${show.slug}-s${season.seasonNumber}`,
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

		const trans: SeasonTransI[] = items.flatMap((seed, i) =>
			Object.entries(seed.translations).map(([lang, tr]) => ({
				// assumes ret is ordered like items.
				pk: ret[i].pk,
				language: lang,
				...tr,
				poster: processOptImage(tr.poster),
				thumbnail: processOptImage(tr.thumbnail),
				banner: processOptImage(tr.banner),
			})),
		);
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
