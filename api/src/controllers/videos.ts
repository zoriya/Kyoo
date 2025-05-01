import { and, eq, exists, inArray, not, notExists, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { Elysia, t } from "elysia";
import { db } from "~/db";
import { entries, entryVideoJoin, shows, videos } from "~/db/schema";
import {
	conflictUpdateAllExcept,
	jsonbBuildObject,
	jsonbObjectAgg,
	values,
} from "~/db/utils";
import { KError } from "~/models/error";
import { bubbleVideo } from "~/models/examples";
import {
	Page,
	Sort,
	createPage,
	isUuid,
	keysetPaginate,
	sortToSql,
} from "~/models/utils";
import { desc as description } from "~/models/utils/descriptions";
import { Guesses, SeedVideo, Video } from "~/models/video";
import { comment } from "~/utils";
import { computeVideoSlug } from "./seed/insert/entries";
import { updateAvailableCount } from "./seed/insert/shows";

const CreatedVideo = t.Object({
	id: t.String({ format: "uuid" }),
	path: t.String({ examples: [bubbleVideo.path] }),
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
					.crossJoin(
						sql`jsonb_array_elements_text(${videos.guess}->'year') as year`,
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
					guesses: jsonbObjectAgg<Guesses["guesses"]>(guess.guess, guess.years),
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
				guesses,
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
		async ({ body, error }) => {
			const vids = await db
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
				});

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
				return error(
					201,
					vids.map((x) => ({ id: x.id, path: x.path, entries: [] })),
				);
			}

			const entriesQ = db
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

			const hasRenderingQ = db
				.select()
				.from(entryVideoJoin)
				.where(eq(entryVideoJoin.entryPk, entriesQ.pk));

			const ret = await db
				.insert(entryVideoJoin)
				.select(
					db
						.select({
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
										eq(entriesQ.showId, sql`(j.entry #>> '{movie, id}')::uuid`),
										eq(entriesQ.showSlug, sql`j.entry #>> '{movie, slug}'`),
									),
									eq(entriesQ.kind, "movie"),
								),
								and(
									sql`j.entry ? 'serie'`,
									or(
										eq(entriesQ.showId, sql`(j.entry #>> '{serie, id}')::uuid`),
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
				.onConflictDoNothing()
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
			return error(
				201,
				vids.map((x) => ({
					id: x.id,
					path: x.path,
					entries: entr[x.pk] ?? [],
				})),
			);
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
			response: { 201: t.Array(CreatedVideo) },
		},
	)
	.delete(
		"",
		async ({ body }) => {
			await db.transaction(async (tx) => {
				const vids = tx.$with("vids").as(
					tx
						.delete(videos)
						.where(eq(videos.path, sql`any(${body})`))
						.returning({ pk: videos.pk }),
				);
				const evj = alias(entryVideoJoin, "evj");
				const delEntries = tx.$with("del_entries").as(
					tx
						.with(vids)
						.select({ entry: entryVideoJoin.entryPk })
						.from(entryVideoJoin)
						.where(
							and(
								inArray(entryVideoJoin.videoPk, tx.select().from(vids)),
								not(
									exists(
										tx
											.select()
											.from(evj)
											.where(
												and(
													eq(evj.entryPk, entryVideoJoin.entryPk),
													not(inArray(evj.videoPk, db.select().from(vids))),
												),
											),
									),
								),
							),
						),
				);
				const delShows = await tx
					.with(delEntries)
					.update(entries)
					.set({ availableSince: null })
					.where(inArray(entries.pk, db.select().from(delEntries)))
					.returning({ show: entries.showPk });

				await updateAvailableCount(
					tx,
					delShows.map((x) => x.show),
					false,
				);
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
			response: { 204: t.Void() },
		},
	);
