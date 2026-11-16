import {
	and,
	count,
	eq,
	exists,
	isNull,
	ne,
	notExists,
	or,
	type SQLWrapper,
	sql,
} from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db, type Transaction } from "~/db";
import {
	entries,
	entryVideoJoin,
	seasons,
	shows,
	showTranslations,
} from "~/db/schema";
import {
	conflictUpdateAllExcept,
	isUniqueConstraint,
	sqlarr,
} from "~/db/utils";
import type { SeedCollection } from "~/models/collections";
import type { SeedMovie } from "~/models/movie";
import type { SeedSerie } from "~/models/serie";
import type { Original } from "~/models/utils";
import { record } from "~/otel";
import { getYear, uniq } from "~/utils";
import { enqueueOptImage, flushImageQueue, type ImageTask } from "../images";

// slug is optional when updating a show via its id.
type Show = Omit<typeof shows.$inferInsert, "slug"> & { slug?: string };
type ShowTrans = typeof showTranslations.$inferInsert;

export const insertShow = record(
	"insertShow",
	async (
		show: Omit<Show, "original" | "backdrop"> & { backdrop?: string | null },
		original: Omit<Original, "poster" | "thumbnail" | "banner" | "logo"> & {
			poster?: string | null;
			thumbnail?: string | null;
			banner?: string | null;
			logo?: string | null;
		},
		translations:
			| SeedMovie["translations"]
			| SeedSerie["translations"]
			| SeedCollection["translations"],
	) => {
		return await db.transaction(async (tx) => {
			const imgQueue: ImageTask[] = [];
			const orig = {
				...original,
				poster: enqueueOptImage(imgQueue, {
					url: original.poster,
					table: shows,
					column: sql`${shows.original}['poster']`,
				}),
				thumbnail: enqueueOptImage(imgQueue, {
					url: original.thumbnail,
					table: shows,
					column: sql`${shows.original}['thumbnail']`,
				}),
				banner: enqueueOptImage(imgQueue, {
					url: original.banner,
					table: shows,
					column: sql`${shows.original}['banner']`,
				}),
				logo: enqueueOptImage(imgQueue, {
					url: original.logo,
					table: shows,
					column: sql`${shows.original}['logo']`,
				}),
			};
			const base = {
				...show,
				genres: uniq(show.genres),
				original: orig,
				backdrop: enqueueOptImage(imgQueue, {
					url: show.backdrop,
					column: shows.backdrop,
				}),
			};
			let ret: Awaited<ReturnType<typeof insertBaseShow>>;
			try {
				ret = show.id
					? await updateBaseShow(tx, { ...base, id: show.id })
					: await insertBaseShow(tx, { ...base, slug: show.slug! });
			} catch (e) {
				if (!isUniqueConstraint(e)) throw e;
				// another show already has one of our external ids (or our new slug when renaming)
				const [duplicate] = await db
					.select({ id: shows.id, slug: shows.slug })
					.from(shows)
					.where(
						and(
							eq(shows.kind, show.kind),
							show.id ? ne(shows.id, show.id) : undefined,
							or(
								...["themoviedatabase", "tvdb", "imdb"].map((provider) =>
									eq(
										sql`${shows.externalId} -> ${provider}::text -> 0 ->> 'dataId'`,
										show.externalId?.[provider]?.[0]?.dataId ?? null,
									),
								),
							),
						),
					)
					.limit(1);
				return {
					status: 409 as const,
					message: duplicate
						? `A ${show.kind} with the same external ids already exists. Use PUT /${show.kind}s/${duplicate.id} to update it.`
						: `The slug ${show.slug} is already used.`,
					details: duplicate,
				};
			}
			if ("status" in ret) return ret;

			const trans: ShowTrans[] = Object.entries(translations).map(
				([lang, tr]) => ({
					pk: ret.pk,
					language: lang,
					...tr,
					latinName: tr.latinName ?? null,
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
			await flushImageQueue(tx, imgQueue, 200);
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

async function updateBaseShow(tx: Transaction, show: Show & { id: string }) {
	// postgres < 18 can't return old values, self join to get the previous slug.
	const old = alias(shows, "old");
	const [ret] = await tx
		.update(shows)
		.set(show)
		.from(old)
		.where(
			and(
				eq(shows.kind, show.kind),
				eq(shows.id, show.id),
				eq(old.pk, shows.pk),
			),
		)
		.returning({
			pk: shows.pk,
			kind: shows.kind,
			id: shows.id,
			slug: shows.slug,
			oldSlug: old.slug,
			updated: sql<boolean>`true`.as("updated"),
		});
	if (ret.slug !== ret.oldSlug) {
		// seasons, entries & videos slugs are prefixed by the show's slug, rename them too.
		const rename = (col: SQLWrapper) =>
			sql`${ret.slug} || substr(${col}, char_length(${ret.oldSlug}) + 1)`;
		await tx
			.update(seasons)
			.set({ slug: rename(seasons.slug) })
			.where(
				and(
					eq(seasons.showPk, ret.pk),
					sql`starts_with(${seasons.slug}, ${ret.oldSlug})`,
				),
			);
		await tx
			.update(entries)
			.set({ slug: rename(entries.slug) })
			.where(
				and(
					eq(entries.showPk, ret.pk),
					sql`starts_with(${entries.slug}, ${ret.oldSlug})`,
				),
			);
		await tx
			.update(entryVideoJoin)
			.set({ slug: rename(entryVideoJoin.slug) })
			.from(entries)
			.where(
				and(
					eq(entries.pk, entryVideoJoin.entryPk),
					eq(entries.showPk, ret.pk),
					sql`starts_with(${entryVideoJoin.slug}, ${ret.oldSlug})`,
				),
			);
	}
	return ret;
}

async function insertBaseShow(tx: Transaction, show: Show & { slug: string }) {
	function insert() {
		return tx
			.insert(shows)
			.values(show)
			.onConflictDoUpdate({
				target: [shows.kind, shows.slug],
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

export async function clearAvailableSince(
	tx: Transaction,
	entriesPk: number[],
) {
	return await tx
		.update(entries)
		.set({ availableSince: null })
		.where(
			and(
				eq(entries.pk, sql`any(${sqlarr(entriesPk)})`),
				notExists(
					tx
						.select()
						.from(entryVideoJoin)
						.where(eq(entries.pk, entryVideoJoin.entryPk)),
				),
			),
		)
		.returning({ show: entries.showPk });
}
