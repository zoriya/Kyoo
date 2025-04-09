import { and, eq, exists, inArray, not, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { Elysia, t } from "elysia";
import { db } from "~/db";
import { entries, entryVideoJoin, shows, videos } from "~/db/schema";
import { jsonbBuildObject, jsonbObjectAgg, sqlarr } from "~/db/utils";
import { bubbleVideo } from "~/models/examples";
import { Page } from "~/models/utils";
import { Guesses, SeedVideo, Video } from "~/models/video";
import { comment } from "~/utils";
import { computeVideoSlug } from "./seed/insert/entries";
import { updateAvailableCount } from "./seed/insert/shows";

const CreatedVideo = t.Object({
	id: t.String({ format: "uuid" }),
	path: t.String({ examples: [bubbleVideo.path] }),
	// entries: t.Array(
	// 	t.Object({
	// 		slug: t.String({ format: "slug", examples: ["bubble-v2"] }),
	// 	}),
	// ),
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
						sql`jsonb_array_elements_text(${videos.guess}->'year') as year`,
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
				.select({ guesses: jsonbObjectAgg<Guesses["guesses"]>(guess.guess, guess.years) })
				.from(guess);

			const paths = await db.select({ path: videos.path }).from(videos);

			return { paths: paths.map((x) => x.path), guesses };
		},
		{
			detail: { description: "Get all video registered & guessed made" },
			response: {
				200: Guesses,
			},
		},
	)
	.post(
		"",
		async ({ body, error }) => {
			const oldRet = await db
				.insert(videos)
				.values(body)
				.onConflictDoNothing()
				.returning({
					pk: videos.pk,
					id: videos.id,
					path: videos.path,
					guess: videos.guess,
				});
			return error(201, oldRet);

			// TODO: this is a huge untested wip
			// const vidsI = db.$with("vidsI").as(
			// 	db.insert(videos).values(body).onConflictDoNothing().returning({
			// 		pk: videos.pk,
			// 		id: videos.id,
			// 		path: videos.path,
			// 		guess: videos.guess,
			// 	}),
			// );
			//
			// const findEntriesQ = db
			// 	.select({
			// 		guess: videos.guess,
			// 		entryPk: entries.pk,
			// 		showSlug: shows.slug,
			// 		// TODO: handle extras here
			// 		// guessit can't know if an episode is a special or not. treat specials like a normal episode.
			// 		kind: sql`
			// 			case when ${entries.kind} = 'movie' then 'movie' else 'episode' end
			// 		`.as("kind"),
			// 		season: entries.seasonNumber,
			// 		episode: entries.episodeNumber,
			// 	})
			// 	.from(entries)
			// 	.leftJoin(entryVideoJoin, eq(entryVideoJoin.entry, entries.pk))
			// 	.leftJoin(videos, eq(videos.pk, entryVideoJoin.video))
			// 	.leftJoin(shows, eq(shows.pk, entries.showPk))
			// 	.as("find_entries");
			//
			// const hasRenderingQ = db
			// 	.select()
			// 	.from(entryVideoJoin)
			// 	.where(eq(entryVideoJoin.entry, findEntriesQ.entryPk));
			//
			// const ret = await db
			// 	.with(vidsI)
			// 	.insert(entryVideoJoin)
			// 	.select(
			// 		db
			// 			.select({
			// 				entry: findEntriesQ.entryPk,
			// 				video: vidsI.pk,
			// 				slug: computeVideoSlug(
			// 					findEntriesQ.showSlug,
			// 					sql`exists(${hasRenderingQ})`,
			// 				),
			// 			})
			// 			.from(vidsI)
			// 			.leftJoin(
			// 				findEntriesQ,
			// 				and(
			// 					eq(
			// 						sql`${findEntriesQ.guess}->'title'`,
			// 						sql`${vidsI.guess}->'title'`,
			// 					),
			// 					// TODO: find if @> with a jsonb created on the fly is
			// 					// better than multiples checks
			// 					sql`${vidsI.guess} @> {"kind": }::jsonb`,
			// 					inArray(findEntriesQ.kind, sql`${vidsI.guess}->'type'`),
			// 					inArray(findEntriesQ.episode, sql`${vidsI.guess}->'episode'`),
			// 					inArray(findEntriesQ.season, sql`${vidsI.guess}->'season'`),
			// 				),
			// 			),
			// 	)
			// 	.onConflictDoNothing()
			// 	.returning({
			// 		slug: entryVideoJoin.slug,
			// 		entryPk: entryVideoJoin.entry,
			// 		id: vidsI.id,
			// 		path: vidsI.path,
			// 	});
			// return error(201, ret as any);
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
