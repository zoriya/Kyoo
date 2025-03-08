import { sql } from "drizzle-orm";
import { db } from "~/db";
import { showTranslations, shows } from "~/db/schema";
import { conflictUpdateAllExcept } from "~/db/utils";
import type { SeedCollection } from "~/models/collections";
import type { SeedMovie } from "~/models/movie";
import type { SeedSerie } from "~/models/serie";
import { processOptImage } from "../images";

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

		const trans: ShowTrans[] = Object.entries(translations).map(
			([lang, tr]) => ({
				pk: ret.pk,
				language: lang,
				...tr,
				poster: processOptImage(tr.poster),
				thumbnail: processOptImage(tr.thumbnail),
				logo: processOptImage(tr.logo),
				banner: processOptImage(tr.banner),
			}),
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
