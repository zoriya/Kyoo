import { and, eq, inArray, sql } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "~/db";
import { entries, entryVideoJoin, shows, videos } from "~/db/schema";
import { bubbleVideo } from "~/models/examples";
import { SeedVideo, Video } from "~/models/video";
import { comment } from "~/utils";
import { computeVideoSlug } from "./seed/insert/entries";

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
	.get("/:id", () => "hello" as unknown as Video, {
		response: { 200: "video" },
	})
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
			// biome-ignore lint/correctness/noUnreachable: leave me alone
			const vidsI = db.$with("vidsI").as(
				db.insert(videos).values(body).onConflictDoNothing().returning({
					pk: videos.pk,
					id: videos.id,
					path: videos.path,
					guess: videos.guess,
				}),
			);

			const findEntriesQ = db
				.select({
					guess: videos.guess,
					entryPk: entries.pk,
					showSlug: shows.slug,
					// TODO: handle extras here
					// guessit can't know if an episode is a special or not. treat specials like a normal episode.
					kind: sql`
						case when ${entries.kind} = 'movie' then 'movie' else 'episode' end
					`.as("kind"),
					season: entries.seasonNumber,
					episode: entries.episodeNumber,
				})
				.from(entries)
				.leftJoin(entryVideoJoin, eq(entryVideoJoin.entry, entries.pk))
				.leftJoin(videos, eq(videos.pk, entryVideoJoin.video))
				.leftJoin(shows, eq(shows.pk, entries.showPk))
				.as("find_entries");

			const hasRenderingQ = db
				.select()
				.from(entryVideoJoin)
				.where(eq(entryVideoJoin.entry, findEntriesQ.entryPk));

			const ret = await db
				.with(vidsI)
				.insert(entryVideoJoin)
				.select(
					db
						.select({
							entry: findEntriesQ.entryPk,
							video: vidsI.pk,
							slug: computeVideoSlug(
								findEntriesQ.showSlug,
								sql`exists(${hasRenderingQ})`,
							),
						})
						.from(vidsI)
						.leftJoin(
							findEntriesQ,
							and(
								eq(
									sql`${findEntriesQ.guess}->'title'`,
									sql`${vidsI.guess}->'title'`,
								),
								// TODO: find if @> with a jsonb created on the fly is
								// better than multiples checks
								sql`${vidsI.guess} @> {"kind": }::jsonb`,
								inArray(findEntriesQ.kind, sql`${vidsI.guess}->'type'`),
								inArray(findEntriesQ.episode, sql`${vidsI.guess}->'episode'`),
								inArray(findEntriesQ.season, sql`${vidsI.guess}->'season'`),
							),
						),
				)
				.onConflictDoNothing()
				.returning({
					slug: entryVideoJoin.slug,
					entryPk: entryVideoJoin.entry,
					id: vidsI.id,
					path: vidsI.path,
				});
			return error(201, ret as any);
		},
		{
			body: t.Array(SeedVideo),
			response: { 201: t.Array(CreatedVideo) },
			detail: {
				description: comment`
					Create videos in bulk.
					Duplicated videos will simply be ignored.

					If a videos has a \`guess\` field, it will be used to automatically register the video under an existing
					movie or entry.
				`,
			},
		},
	);
