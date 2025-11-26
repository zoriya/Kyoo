import { sql } from "drizzle-orm";
import { db } from "~/db";
import { showStudioJoin, studios, studioTranslations } from "~/db/schema";
import { conflictUpdateAllExcept, sqlarr, unnestValues } from "~/db/utils";
import type { SeedStudio } from "~/models/studio";
import { enqueueOptImage, flushImageQueue, type ImageTask } from "../images";

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
			.select(unnestValues(vals, studios))
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

		const imgQueue: ImageTask[] = [];
		const trans: StudioTransI[] = seed.flatMap((x, i) =>
			Object.entries(x.translations).map(([lang, tr]) => ({
				pk: ret[i].pk,
				language: lang,
				name: tr.name,
				logo: enqueueOptImage(imgQueue, {
					url: tr.logo,
					column: studioTranslations.logo,
				}),
			})),
		);
		await flushImageQueue(tx, imgQueue, -100);
		await tx
			.insert(studioTranslations)
			.select(unnestValues(trans, studioTranslations))
			.onConflictDoUpdate({
				target: [studioTranslations.pk, studioTranslations.language],
				set: conflictUpdateAllExcept(studioTranslations, ["pk", "language"]),
			});

		await tx
			.insert(showStudioJoin)
			.select(
				db
					.select({
						showPk: sql`${showPk}`.as("showPk"),
						studioPk: sql`v.studioPk`.as("studioPk"),
					})
					.from(sql`unnest(${sqlarr(ret.map((x) => x.pk))}) as v("studioPk")`),
			)
			.onConflictDoNothing();
		return ret;
	});
};
