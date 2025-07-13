import { sql } from "drizzle-orm";
import { db } from "~/db";
import { shows, showTranslations } from "~/db/schema";
import { conflictUpdateAllExcept } from "~/db/utils";
import type { SeedCollection } from "~/models/collections";
import type { SeedMovie } from "~/models/movie";
import type { SeedSerie } from "~/models/serie";
import { enqueueOptImage } from "../images";

type ShowTrans = typeof showTranslations.$inferInsert;

export const insertCollection = async (
	collection: SeedCollection | undefined,
	show: (({ kind: "movie" } & SeedMovie) | ({ kind: "serie" } & SeedSerie)) & {
		nextRefresh: string;
	},
) => {
	if (!collection) return null;
	const { translations, ...col } = collection;

	return await db.transaction(async (tx) => {
		const [ret] = await tx
			.insert(shows)
			.values({
				kind: "collection",
				status: "unknown",
				startAir: show.kind === "movie" ? show.airDate : show.startAir,
				endAir: show.kind === "movie" ? show.airDate : show.endAir,
				nextRefresh: show.nextRefresh,
				entriesCount: 0,
				original: {} as any,
				...col,
			})
			.onConflictDoUpdate({
				target: shows.slug,
				set: {
					...conflictUpdateAllExcept(shows, [
						"pk",
						"id",
						"slug",
						"createdAt",
						"startAir",
						"endAir",
					]),
					startAir: sql`least(${shows.startAir}, excluded.start_air)`,
					endAir: sql`greatest(${shows.endAir}, excluded.end_air)`,
				},
			})
			.returning({ pk: shows.pk, id: shows.id, slug: shows.slug });

		const trans: ShowTrans[] = await Promise.all(
			Object.entries(translations).map(async ([lang, tr]) => ({
				pk: ret.pk,
				language: lang,
				...tr,
				poster: await enqueueOptImage(tx, {
					url: tr.poster,
					column: showTranslations.poster,
				}),
				thumbnail: await enqueueOptImage(tx, {
					url: tr.thumbnail,
					column: showTranslations.thumbnail,
				}),
				logo: await enqueueOptImage(tx, {
					url: tr.logo,
					column: showTranslations.logo,
				}),
				banner: await enqueueOptImage(tx, {
					url: tr.banner,
					column: showTranslations.banner,
				}),
			})),
		);
		await tx
			.insert(showTranslations)
			.values(trans)
			.onConflictDoUpdate({
				target: [showTranslations.pk, showTranslations.language],
				set: conflictUpdateAllExcept(showTranslations, ["pk", "language"]),
			});
		return ret;
	});
};
