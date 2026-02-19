import { sql } from "drizzle-orm";
import { db } from "~/db";
import { shows, showTranslations } from "~/db/schema";
import { conflictUpdateAllExcept } from "~/db/utils";
import type { SeedCollection } from "~/models/collections";
import type { SeedMovie } from "~/models/movie";
import type { SeedSerie } from "~/models/serie";
import type { Original } from "~/models/utils";
import { record } from "~/otel";
import { uniq } from "~/utils";
import { enqueueOptImage, flushImageQueue, type ImageTask } from "../images";

type ShowTrans = typeof showTranslations.$inferInsert;

export const insertCollection = record(
	"insertCollection",
	async (
		collection: SeedCollection | null | undefined,
		show: (
			| ({ kind: "movie" } & SeedMovie)
			| ({ kind: "serie" } & SeedSerie)
		) & {
			nextRefresh: Date;
		},
		original: Original,
	) => {
		if (!collection) return null;
		const { translations, genres, ...col } = collection;

		return await db.transaction(async (tx) => {
			const imgQueue: ImageTask[] = [];
			const [ret] = await tx
				.insert(shows)
				.values({
					kind: "collection",
					status: "unknown",
					startAir: show.kind === "movie" ? show.airDate : show.startAir,
					endAir: show.kind === "movie" ? show.airDate : show.endAir,
					nextRefresh: show.nextRefresh,
					entriesCount: 0,
					original: {
						language: original.language,
						name: original.name,
						latinName: original.latinName,
					},
					genres: uniq(show.genres),
					...col,
				})
				.onConflictDoUpdate({
					target: [shows.kind, shows.slug],
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
					poster: enqueueOptImage(imgQueue, {
						url: tr.poster,
						column: showTranslations.poster,
					}),
					thumbnail: enqueueOptImage(imgQueue, {
						url: tr.thumbnail,
						column: showTranslations.thumbnail,
					}),
					logo: enqueueOptImage(imgQueue, {
						url: tr.logo,
						column: showTranslations.logo,
					}),
					banner: enqueueOptImage(imgQueue, {
						url: tr.banner,
						column: showTranslations.banner,
					}),
				}),
			);
			await flushImageQueue(tx, imgQueue, 100);
			// we can't unnest values here because show translations contains arrays.
			await tx
				.insert(showTranslations)
				.values(trans)
				.onConflictDoUpdate({
					target: [showTranslations.pk, showTranslations.language],
					set: conflictUpdateAllExcept(showTranslations, ["pk", "language"]),
				});
			return ret;
		});
	},
);
