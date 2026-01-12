import { db } from "~/db";
import { seasons, seasonTranslations } from "~/db/schema";
import { conflictUpdateAllExcept, unnestValues } from "~/db/utils";
import type { SeedSeason } from "~/models/season";
import { record } from "~/otel";
import { enqueueOptImage, flushImageQueue, type ImageTask } from "../images";
import { guessNextRefresh } from "../refresh";

type SeasonI = typeof seasons.$inferInsert;
type SeasonTransI = typeof seasonTranslations.$inferInsert;

export const insertSeasons = record(
	"insertSeasons",
	async (show: { pk: number; slug: string }, items: SeedSeason[]) => {
		if (!items.length) return [];

		return db.transaction(async (tx) => {
			const imgQueue: ImageTask[] = [];
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
				.select(unnestValues(vals, seasons))
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
					poster: enqueueOptImage(imgQueue, {
						url: tr.poster,
						column: seasonTranslations.poster,
					}),
					thumbnail: enqueueOptImage(imgQueue, {
						url: tr.thumbnail,
						column: seasonTranslations.thumbnail,
					}),
					banner: enqueueOptImage(imgQueue, {
						url: tr.banner,
						column: seasonTranslations.banner,
					}),
				})),
			);
			await flushImageQueue(tx, imgQueue, -10);
			if (trans.length === 0) return ret;
			await tx
				.insert(seasonTranslations)
				.select(unnestValues(trans, seasonTranslations))
				.onConflictDoUpdate({
					target: [seasonTranslations.pk, seasonTranslations.language],
					set: conflictUpdateAllExcept(seasonTranslations, ["pk", "language"]),
				});

			return ret;
		});
	},
);
