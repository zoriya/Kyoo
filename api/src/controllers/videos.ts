import { and, eq, notExists, or, sql } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "~/db";
import { entries, entryVideoJoin, shows, videos } from "~/db/schema";
import {
	conflictUpdateAllExcept,
	isUniqueConstraint,
	jsonbBuildObject,
	jsonbObjectAgg,
	sqlarr,
	values,
} from "~/db/utils";
import { KError } from "~/models/error";
import { bubbleVideo } from "~/models/examples";
import {
	Page,
	type Resource,
	Sort,
	createPage,
	isUuid,
	keysetPaginate,
	sortToSql,
} from "~/models/utils";
import { desc as description } from "~/models/utils/descriptions";
import { Guess, Guesses, SeedVideo, Video } from "~/models/video";
import { comment } from "~/utils";
import { computeVideoSlug } from "./seed/insert/entries";
import {
	updateAvailableCount,
	updateAvailableSince,
} from "./seed/insert/shows";

const CreatedVideo = t.Object({
	id: t.String({ format: "uuid" }),
	path: t.String({ examples: [bubbleVideo.path] }),
	guess: t.Omit(Guess, ["history"]),
	entries: t.Array(
		t.Object({
			slug: t.String({ format: "slug", examples: ["bubble-v2"] }),
		}),
	),
});

export const videosH = new Elysia({ prefix: "/videos", tags: ["videos"] })
	.model({
		video: Video,
		"created-videos": t.Array(CreatedVideo),
		error: t.Object({}),
	})
	.get(
		"",
		async () => {
			const years = db.$with("years").as(
				db
					.select({
						guess: sql`${videos.guess}->>'title'`.as("guess"),
						year: sql`coalesce(year, 'unknown')`.as("year"),
						id: shows.id,
						slug: shows.slug,
					})
					.from(videos)
					.leftJoin(
						sql`jsonb_array_elements_text(${videos.guess}->'years') as year`,
						sql`true`,
					)
					.innerJoin(entryVideoJoin, eq(entryVideoJoin.videoPk, videos.pk))
					.innerJoin(entries, eq(entries.pk, entryVideoJoin.entryPk))
					.innerJoin(shows, eq(shows.pk, entries.showPk)),
			);

			const guess = db.$with("guess").as(
				db
					.select({
						guess: years.guess,
						years: jsonbObjectAgg(
							years.year,
							jsonbBuildObject({ id: years.id, slug: years.slug }),
						).as("years"),
					})
					.from(years)
					.groupBy(years.guess),
			);

			const [{ guesses }] = await db
				.with(years, guess)
				.select({
					guesses: jsonbObjectAgg<Record<string, Resource>>(
						guess.guess,
						guess.years,
					),
				})
				.from(guess);

			const paths = await db.select({ path: videos.path }).from(videos);

			const unmatched = await db
				.select({ path: videos.path })
				.from(videos)
				.where(
					notExists(
						db
							.select()
							.from(entryVideoJoin)
							.where(eq(entryVideoJoin.videoPk, videos.pk)),
					),
				);

			return {
				paths: paths.map((x) => x.path),
				guesses: guesses ?? {},
				unmatched: unmatched.map((x) => x.path),
			};
		},
		{
			detail: { description: "Get all video registered & guessed made" },
			response: {
				200: Guesses,
			},
		},
	)
	.get(
		"unknowns",
		async ({ query: { sort, query, limit, after }, request: { url } }) => {
			const ret = await db
				.select()
				.from(videos)
				.where(
					and(
						notExists(
							db
								.select()
								.from(entryVideoJoin)
								.where(eq(videos.pk, entryVideoJoin.videoPk)),
						),
						query
							? or(
									sql`${videos.path} %> ${query}::text`,
									sql`${videos.guess}->'title' %> ${query}::text`,
								)
							: undefined,
						keysetPaginate({ after, sort }),
					),
				)
				.orderBy(...(query ? [] : sortToSql(sort)), videos.pk)
				.limit(limit);
			return createPage(ret, { url, sort, limit });
		},
		{
			detail: { description: "Get unknown/unmatch videos." },
			query: t.Object({
				sort: Sort(
					{ createdAt: videos.createdAt, path: videos.path },
					{ default: ["-createdAt"], tablePk: videos.pk },
				),
				query: t.Optional(t.String({ description: description.query })),
				limit: t.Integer({
					minimum: 1,
					maximum: 250,
					default: 50,
					description: "Max page size.",
				}),
				after: t.Optional(t.String({ description: description.after })),
			}),
			response: {
				200: Page(Video),
				422: KError,
			},
		},
	)
	.post(
		"",
		async ({ body, status }) => {
			return await db.transaction(async (tx) => {
				let vids: { pk: number; id: string; path: string; guess: Guess }[] = [];
				try {
					vids = await tx
						.insert(videos)
						.values(body)
						.onConflictDoUpdate({
							target: [videos.path],
							set: conflictUpdateAllExcept(videos, ["pk", "id", "createdAt"]),
						})
						.returning({
							pk: videos.pk,
							id: videos.id,
							path: videos.path,
							guess: videos.guess,
						});
				} catch (e) {
					if (!isUniqueConstraint(e)) throw e;
					return status(409, {
						status: 409,
						message: comment`
							Invalid rendering. A video with the same (rendering, part, version) combo
							(but with a different path) already exists in db.

							rendering should be computed by the sha of your path (excluding only the version & part numbers)
						`,
					});
				}

				const vidEntries = body.flatMap((x) => {
					if (!x.for) return [];
					return x.for.map((e) => ({
						video: vids.find((v) => v.path === x.path)!.pk,
						path: x.path,
						entry: {
							...e,
							movie:
								"movie" in e
									? isUuid(e.movie)
										? { id: e.movie }
										: { slug: e.movie }
									: undefined,
							serie:
								"serie" in e
									? isUuid(e.serie)
										? { id: e.serie }
										: { slug: e.serie }
									: undefined,
						},
					}));
				});

				if (!vidEntries.length) {
					return status(
						201,
						vids.map((x) => ({
							id: x.id,
							path: x.path,
							guess: x.guess,
							entries: [],
						})),
					);
				}

				const entriesQ = tx
					.select({
						pk: entries.pk,
						id: entries.id,
						slug: entries.slug,
						kind: entries.kind,
						seasonNumber: entries.seasonNumber,
						episodeNumber: entries.episodeNumber,
						order: entries.order,
						showId: sql`${shows.id}`.as("showId"),
						showSlug: sql`${shows.slug}`.as("showSlug"),
						externalId: entries.externalId,
					})
					.from(entries)
					.innerJoin(shows, eq(entries.showPk, shows.pk))
					.as("entriesQ");

				const hasRenderingQ = tx
					.select()
					.from(entryVideoJoin)
					.where(eq(entryVideoJoin.entryPk, entriesQ.pk));

				const ret = await tx
					.insert(entryVideoJoin)
					.select(
						tx
							.selectDistinctOn([entriesQ.pk, videos.pk], {
								entryPk: entriesQ.pk,
								videoPk: videos.pk,
								slug: computeVideoSlug(
									entriesQ.slug,
									sql`exists(${hasRenderingQ})`,
								),
							})
							.from(
								values(vidEntries, {
									video: "integer",
									entry: "jsonb",
								}).as("j"),
							)
							.innerJoin(videos, eq(videos.pk, sql`j.video`))
							.innerJoin(
								entriesQ,
								or(
									and(
										sql`j.entry ? 'slug'`,
										eq(entriesQ.slug, sql`j.entry->>'slug'`),
									),
									and(
										sql`j.entry ? 'movie'`,
										or(
											eq(
												entriesQ.showId,
												sql`(j.entry #>> '{movie, id}')::uuid`,
											),
											eq(entriesQ.showSlug, sql`j.entry #>> '{movie, slug}'`),
										),
										eq(entriesQ.kind, "movie"),
									),
									and(
										sql`j.entry ? 'serie'`,
										or(
											eq(
												entriesQ.showId,
												sql`(j.entry #>> '{serie, id}')::uuid`,
											),
											eq(entriesQ.showSlug, sql`j.entry #>> '{serie, slug}'`),
										),
										or(
											and(
												sql`j.entry ?& array['season', 'episode']`,
												eq(
													entriesQ.seasonNumber,
													sql`(j.entry->>'season')::integer`,
												),
												eq(
													entriesQ.episodeNumber,
													sql`(j.entry->>'episode')::integer`,
												),
											),
											and(
												sql`j.entry ? 'order'`,
												eq(entriesQ.order, sql`(j.entry->>'order')::float`),
											),
											and(
												sql`j.entry ? 'special'`,
												eq(
													entriesQ.episodeNumber,
													sql`(j.entry->>'special')::integer`,
												),
												eq(entriesQ.kind, "special"),
											),
										),
									),
									and(
										sql`j.entry ? 'externalId'`,
										sql`j.entry->'externalId' <@ ${entriesQ.externalId}`,
									),
								),
							),
					)
					.onConflictDoUpdate({
						target: [entryVideoJoin.entryPk, entryVideoJoin.videoPk],
						// this is basically a `.onConflictDoNothing()` but we want `returning` to give us the existing data
						set: { entryPk: sql`excluded.entry_pk` },
					})
					.returning({
						slug: entryVideoJoin.slug,
						entryPk: entryVideoJoin.entryPk,
						videoPk: entryVideoJoin.videoPk,
					});
				const entr = ret.reduce(
					(acc, x) => {
						acc[x.videoPk] ??= [];
						acc[x.videoPk].push({ slug: x.slug });
						return acc;
					},
					{} as Record<number, { slug: string }[]>,
				);

				const entriesPk = [...new Set(ret.map((x) => x.entryPk))];
				await updateAvailableCount(
					tx,
					tx
						.selectDistinct({ pk: entries.showPk })
						.from(entries)
						.where(eq(entries.pk, sql`any(${sqlarr(entriesPk)})`)),
				);
				await updateAvailableSince(tx, entriesPk);

				return status(
					201,
					vids.map((x) => ({
						id: x.id,
						path: x.path,
						guess: x.guess,
						entries: entr[x.pk] ?? [],
					})),
				);
			});
		},
		{
			detail: {
				description: comment`
					Create videos in bulk.
					Duplicated videos will simply be ignored.

					If a videos has a \`guess\` field, it will be used to automatically register the video under an existing
					movie or entry.
				`,
			},
			body: t.Array(SeedVideo),
			response: {
				201: t.Array(CreatedVideo),
				409: {
					...KError,
					description:
						"Invalid rendering specified. (conflicts with an existing video)",
				},
			},
		},
	)
	.delete(
		"",
		async ({ body }) => {
			return await db.transaction(async (tx) => {
				const vids = tx.$with("vids").as(
					tx
						.delete(videos)
						.where(eq(videos.path, sql`any(${sqlarr(body)})`))
						.returning({ pk: videos.pk, path: videos.path }),
				);

				const deletedJoin = await tx
					.with(vids)
					.select({ entryPk: entryVideoJoin.entryPk, path: vids.path })
					.from(entryVideoJoin)
					.rightJoin(vids, eq(vids.pk, entryVideoJoin.videoPk));

				const delEntries = await tx
					.update(entries)
					.set({ availableSince: null })
					.where(
						and(
							eq(
								entries.pk,
								sql`any(${sqlarr(
									deletedJoin.filter((x) => x.entryPk).map((x) => x.entryPk!),
								)})`,
							),
							notExists(
								tx
									.select()
									.from(entryVideoJoin)
									.where(eq(entries.pk, entryVideoJoin.entryPk)),
							),
						),
					)
					.returning({ show: entries.showPk });

				await updateAvailableCount(
					tx,
					delEntries.map((x) => x.show),
					false,
				);

				return [...new Set(deletedJoin.map((x) => x.path))];
			});
		},
		{
			detail: { description: "Delete videos in bulk." },
			body: t.Array(
				t.String({
					description: "Path of the video to delete",
					examples: [bubbleVideo.path],
				}),
			),
			response: { 200: t.Array(t.String()) },
		},
	);
