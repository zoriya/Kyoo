import { db } from "~/db";
import { showStudioJoin, studios, studioTranslations } from "~/db/schema";
import { conflictUpdateAllExcept } from "~/db/utils";
import type { SeedStudio } from "~/models/studio";
import { enqueueOptImage } from "../images";

type StudioI = typeof studios.$inferInsert;
type StudioTransI = typeof studioTranslations.$inferInsert;

export const insertStudios = async (
	seed: SeedStudio[] | undefined,
	showPk: number,
) => {
	if (!seed?.length) return [];

	return await db.transaction(async (tx) => {
		const vals: StudioI[] = seed.map((x) => {
			const { translations, ...item } = x;
			return item;
		});

		const ret = await tx
			.insert(studios)
			.values(vals)
			.onConflictDoUpdate({
				target: studios.slug,
				set: conflictUpdateAllExcept(studios, [
					"pk",
					"id",
					"slug",
					"createdAt",
				]),
			})
			.returning({ pk: studios.pk, id: studios.id, slug: studios.slug });

		const trans: StudioTransI[] = (
			await Promise.all(
				seed.map(
					async (x, i) =>
						await Promise.all(
							Object.entries(x.translations).map(async ([lang, tr]) => ({
								pk: ret[i].pk,
								language: lang,
								name: tr.name,
								logo: await enqueueOptImage(tx, {
									url: tr.logo,
									column: studioTranslations.logo,
								}),
							})),
						),
				),
			)
		).flat();
		await tx
			.insert(studioTranslations)
			.values(trans)
			.onConflictDoUpdate({
				target: [studioTranslations.pk, studioTranslations.language],
				set: conflictUpdateAllExcept(studioTranslations, ["pk", "language"]),
			});

		await tx
			.insert(showStudioJoin)
			.values(ret.map((studio) => ({ showPk: showPk, studioPk: studio.pk })))
			.onConflictDoNothing();
		return ret;
	});
};
