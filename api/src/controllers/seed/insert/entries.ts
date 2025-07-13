import { type Column, eq, type SQL, sql } from "drizzle-orm";
import { db } from "~/db";
import {
	entries,
	entryTranslations,
	entryVideoJoin,
	videos,
} from "~/db/schema";
import { conflictUpdateAllExcept, values } from "~/db/utils";
import type { SeedEntry as SEntry, SeedExtra as SExtra } from "~/models/entry";
import { enqueueOptImage } from "../images";
import { guessNextRefresh } from "../refresh";
import { updateAvailableCount, updateAvailableSince } from "./shows";

type SeedEntry = SEntry & {
	video?: undefined;
};
type SeedExtra = Omit<SExtra, "kind"> & {
	videos?: undefined;
	translations?: undefined;
	kind: "extra";
	extraKind: SExtra["kind"];
};

type EntryI = typeof entries.$inferInsert;
type EntryTransI = typeof entryTranslations.$inferInsert;

const generateSlug = (
	showSlug: string,
	entry: SeedEntry | SeedExtra,
): string => {
	switch (entry.kind) {
		case "episode":
			return `${showSlug}-s${entry.seasonNumber}e${entry.episodeNumber}`;
		case "special":
			return `${showSlug}-sp${entry.number}`;
		case "movie":
			if (entry.slug) return entry.slug;
			return entry.order === 1 ? showSlug : `${showSlug}-${entry.order}`;
		case "extra":
			return entry.slug;
	}
};

export const insertEntries = async (
	show: { pk: number; slug: string; kind: "movie" | "serie" | "collection" },
	items: (SeedEntry | SeedExtra)[],
	onlyExtras = false,
) => {
	if (!items.length) return [];

	const retEntries = await db.transaction(async (tx) => {
		const vals: EntryI[] = await Promise.all(
			items.map(async (seed) => {
				const { translations, videos, video, ...entry } = seed;
				return {
					...entry,
					showPk: show.pk,
					slug: generateSlug(show.slug, seed),
					thumbnail: await enqueueOptImage(tx, {
						url: seed.thumbnail,
						column: entries.thumbnail,
					}),
					nextRefresh:
						entry.kind !== "extra"
							? guessNextRefresh(entry.airDate ?? new Date())
							: guessNextRefresh(new Date()),
					episodeNumber:
						entry.kind === "episode"
							? entry.episodeNumber
							: entry.kind === "special"
								? entry.number
								: undefined,
				};
			}),
		);
		const ret = await tx
			.insert(entries)
			.values(vals)
			.onConflictDoUpdate({
				target: entries.slug,
				set: conflictUpdateAllExcept(entries, [
					"pk",
					"showPk",
					"id",
					"slug",
					"createdAt",
				]),
			})
			.returning({ pk: entries.pk, id: entries.id, slug: entries.slug });

		const trans: EntryTransI[] = (
			await Promise.all(
				items.map(async (seed, i) => {
					if (seed.kind === "extra") {
						return [
							{
								pk: ret[i].pk,
								// yeah we hardcode the language to extra because if we want to support
								// translations one day it won't be awkward
								language: "extra",
								name: seed.name,
								description: null,
								poster: undefined,
							},
						];
					}

					return await Promise.all(
						Object.entries(seed.translations).map(async ([lang, tr]) => ({
							// assumes ret is ordered like items.
							pk: ret[i].pk,
							language: lang,
							...tr,
							poster:
								seed.kind === "movie"
									? await enqueueOptImage(tx, {
											url: (tr as any).poster,
											column: entryTranslations.poster,
										})
									: undefined,
						})),
					);
				}),
			)
		).flat();
		await tx
			.insert(entryTranslations)
			.values(trans)
			.onConflictDoUpdate({
				target: [entryTranslations.pk, entryTranslations.language],
				set: conflictUpdateAllExcept(entryTranslations, ["pk", "language"]),
			});

		return ret;
	});

	const vids = items.flatMap((seed, i) => {
		if (seed.kind === "extra") {
			return {
				videoId: seed.video,
				entryPk: retEntries[i].pk,
				entrySlug: retEntries[i].slug,
				needRendering: false,
			};
		}
		if (!seed.videos) return [];
		return seed.videos.map((x, j) => ({
			videoId: x,
			entryPk: retEntries[i].pk,
			entrySlug: retEntries[i].slug,
			// The first video should not have a rendering.
			needRendering: j !== 0 && seed.videos!.length > 1,
		}));
	});

	if (vids.length === 0) {
		// we have not added videos but we need to update the `entriesCount`
		if (show.kind === "serie" && !onlyExtras)
			await updateAvailableCount(db, [show.pk], true);
		return retEntries.map((x) => ({ id: x.id, slug: x.slug, videos: [] }));
	}

	const retVideos = await db.transaction(async (tx) => {
		const ret = await tx
			.insert(entryVideoJoin)
			.select(
				db
					.select({
						entryPk: sql<number>`vids.entryPk`.as("entry"),
						videoPk: videos.pk,
						slug: computeVideoSlug(
							sql`vids.entrySlug`,
							sql`vids.needRendering`,
						),
					})
					.from(
						values(vids, {
							entryPk: "integer",
							needRendering: "boolean",
							videoId: "uuid",
						}).as("vids"),
					)
					.innerJoin(videos, eq(videos.id, sql`vids.videoId`)),
			)
			.onConflictDoNothing()
			.returning({
				slug: entryVideoJoin.slug,
				entryPk: entryVideoJoin.entryPk,
			});

		if (!onlyExtras)
			await updateAvailableCount(tx, [show.pk], show.kind === "serie");

		await updateAvailableSince(tx, [...new Set(vids.map((x) => x.entryPk))]);
		return ret;
	});

	return retEntries.map((entry) => ({
		id: entry.id,
		slug: entry.slug,
		videos: retVideos.filter((x) => x.entryPk === entry.pk),
	}));
};

export function computeVideoSlug(entrySlug: SQL | Column, needsRendering: SQL) {
	return sql<string>`
		concat(
			${entrySlug},
			case when ${videos.part} is not null then ('-p' || ${videos.part}) else '' end,
			case when ${videos.version} <> 1 then ('-v' || ${videos.version}) else '' end,
			case when ${needsRendering} then concat('-', ${videos.rendering}) else '' end
		)
	`.as("slug");
}
