import {
	and,
	count,
	eq,
	exists,
	isNull,
	ne,
	type SQLWrapper,
	sql,
} from "drizzle-orm";
import { db, type Transaction } from "~/db";
import {
	entries,
	entryVideoJoin,
	seasons,
	shows,
	showTranslations,
} from "~/db/schema";
import { conflictUpdateAllExcept, sqlarr } from "~/db/utils";
import type { SeedCollection } from "~/models/collections";
import type { SeedMovie } from "~/models/movie";
import type { SeedSerie } from "~/models/serie";
import type { Original } from "~/models/utils";
import { getYear } from "~/utils";
import { enqueueOptImage } from "../images";

type Show = typeof shows.$inferInsert;
type ShowTrans = typeof showTranslations.$inferInsert;

export const insertShow = async (
	show: Omit<Show, "original">,
	original: Original & {
		poster: string | null;
		thumbnail: string | null;
		banner: string | null;
		logo: string | null;
	},
	translations:
		| SeedMovie["translations"]
		| SeedSerie["translations"]
		| SeedCollection["translations"],
) => {
	return await db.transaction(async (tx) => {
		const orig = {
			...original,
			poster: await enqueueOptImage(tx, {
				url: original.poster,
				table: shows,
				column: sql`${shows.original}['poster']`,
			}),
			thumbnail: await enqueueOptImage(tx, {
				url: original.thumbnail,
				table: shows,
				column: sql`${shows.original}['thumbnail']`,
			}),
			banner: await enqueueOptImage(tx, {
				url: original.banner,
				table: shows,
				column: sql`${shows.original}['banner']`,
			}),
			logo: await enqueueOptImage(tx, {
				url: original.logo,
				table: shows,
				column: sql`${shows.original}['logo']`,
			}),
		};
		const ret = await insertBaseShow(tx, { ...show, original: orig });
		if ("status" in ret) return ret;

		const trans: ShowTrans[] = await Promise.all(
			Object.entries(translations).map(async ([lang, tr]) => ({
				pk: ret.pk,
				language: lang,
				...tr,
				latinName: tr.latinName ?? null,
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

async function insertBaseShow(tx: Transaction, show: Show) {
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
				kind: shows.kind,
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
	const [{ pk, id, kind }] = await db
		.select({ pk: shows.pk, id: shows.id, kind: shows.kind })
		.from(shows)
		.where(eq(shows.slug, show.slug))
		.limit(1);
	return {
		status: 409 as const,
		kind,
		pk,
		id,
		slug: show.slug,
	};
}

export async function updateAvailableCount(
	tx: Transaction,
	showPks: number[] | SQLWrapper,
	updateEntryCount = false,
) {
	const showPkQ = Array.isArray(showPks) ? sqlarr(showPks) : showPks;
	await tx
		.update(shows)
		.set({
			availableCount: sql`${db
				.select({ count: count() })
				.from(entries)
				.where(
					and(
						eq(entries.showPk, shows.pk),
						ne(entries.kind, "extra"),
						exists(
							db
								.select()
								.from(entryVideoJoin)
								.where(eq(entryVideoJoin.entryPk, entries.pk)),
						),
					),
				)}`,
			...(updateEntryCount && {
				entriesCount: sql`${db
					.select({ count: count() })
					.from(entries)
					.where(
						and(eq(entries.showPk, shows.pk), ne(entries.kind, "extra")),
					)}`,
			}),
		})
		.where(eq(shows.pk, sql`any(${showPkQ})`));
	await tx
		.update(seasons)
		.set({
			availableCount: sql`${db
				.select({ count: count() })
				.from(entries)
				.where(
					and(
						eq(entries.showPk, seasons.showPk),
						eq(entries.seasonNumber, seasons.seasonNumber),
						ne(entries.kind, "extra"),
						exists(
							db
								.select()
								.from(entryVideoJoin)
								.where(eq(entryVideoJoin.entryPk, entries.pk)),
						),
					),
				)}`,
			...(updateEntryCount && {
				entriesCount: sql`${db
					.select({ count: count() })
					.from(entries)
					.where(
						and(
							eq(entries.showPk, seasons.showPk),
							eq(entries.seasonNumber, seasons.seasonNumber),
							ne(entries.kind, "extra"),
						),
					)}`,
			}),
		})
		.where(eq(seasons.showPk, sql`any(${showPkQ})`));
}

export async function updateAvailableSince(
	tx: Transaction,
	entriesPk: number[],
) {
	return await tx
		.update(entries)
		.set({ availableSince: sql`now()` })
		.where(
			and(
				eq(entries.pk, sql`any(${sqlarr(entriesPk)})`),
				isNull(entries.availableSince),
			),
		);
}
