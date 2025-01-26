import { eq, sql } from "drizzle-orm";
import { db } from "~/db";
import { showTranslations, shows } from "~/db/schema";
import { conflictUpdateAllExcept } from "~/db/utils";
import type { SeedMovie } from "~/models/movie";
import type { SeedSerie } from "~/models/serie";
import { getYear } from "~/utils";
import { processOptImage } from "../images";

type Show = typeof shows.$inferInsert;
type ShowTrans = typeof showTranslations.$inferInsert;

export const insertShow = async (
	show: Show,
	translations: SeedMovie["translations"] | SeedSerie["translations"],
) => {
	return await db.transaction(async (tx) => {
		const ret = await insertBaseShow(tx, show);
		if ("status" in ret) return ret;

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

async function insertBaseShow(
	tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
	show: Show,
) {
	function insert() {
		return tx
			.insert(shows)
			.values(show)
			.onConflictDoUpdate({
				target: shows.slug,
				set: conflictUpdateAllExcept(shows, ["pk", "id", "slug", "createdAt"]),
				// if year is different, this is not an update but a conflict (ex: dune-1984 vs dune-2021)
				setWhere: sql`date_part('year', ${shows.startAir}) = date_part('year', excluded."start_air")`,
			})
			.returning({
				pk: shows.pk,
				id: shows.id,
				slug: shows.slug,
				// https://stackoverflow.com/questions/39058213/differentiate-inserted-and-updated-rows-in-upsert-using-system-columns/39204667#39204667
				updated: sql<boolean>`(xmax <> 0)`.as("updated"),
			});
	}

	let [ret] = await insert();
	if (ret) return ret;

	// ret is undefined when the conflict's where return false (meaning we have
	// a conflicting slug but a different air year.
	// try to insert adding the year at the end of the slug.
	if (show.startAir && !show.slug.endsWith(`${getYear(show.startAir)}`)) {
		show.slug = `${show.slug}-${getYear(show.startAir)}`;
		[ret] = await insert();
		if (ret) return ret;
	}

	// if at this point ret is still undefined, we could not reconciliate.
	// simply bail and let the caller handle this.
	const [{ id }] = await db
		.select({ id: shows.id })
		.from(shows)
		.where(eq(shows.slug, show.slug))
		.limit(1);
	return {
		status: 409 as const,
		id,
		slug: show.slug,
	};
}
