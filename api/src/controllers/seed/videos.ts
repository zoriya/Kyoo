import { and, eq, notExists, sql } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { auth } from "~/auth";
import { db } from "~/db";
import { entries, entryVideoJoin, videos } from "~/db/schema";
import {
	conflictUpdateAllExcept,
	isUniqueConstraint,
	sqlarr,
	unnestValues,
} from "~/db/utils";
import { KError } from "~/models/error";
import { bubbleVideo } from "~/models/examples";
import { isUuid } from "~/models/utils";
import { Guess, SeedVideo, Video } from "~/models/video";
import { comment } from "~/utils";
import { updateAvailableCount, updateAvailableSince } from "./insert/shows";
import { linkVideos } from "./video-links";

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

async function createVideos(body: SeedVideo[], clearLinks: boolean) {
	if (body.length === 0) {
		return { status: 422, message: "No videos" } as const;
	}
	return await db.transaction(async (tx) => {
		let vids: { pk: number; id: string; path: string; guess: Guess }[] = [];
		try {
			vids = await tx
				.insert(videos)
				.select(unnestValues(body, videos))
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
			return {
				status: 409,
				message: comment`
					Invalid rendering. A video with the same (rendering, part, version) combo
					(but with a different path) already exists in db.

					rendering should be computed by the sha of your path (excluding only the version & part numbers)
				`,
			} as const;
		}

		const vidEntries = body.flatMap((x) => {
			if (!x.for) return [];
			return x.for.map((e) => ({
				video: vids.find((v) => v.path === x.path)!.pk,
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
			return vids.map((x) => ({
				id: x.id,
				path: x.path,
				guess: x.guess,
				entries: [],
			}));
		}

		if (clearLinks) {
			await tx
				.delete(entryVideoJoin)
				.where(
					eq(
						entryVideoJoin.videoPk,
						sql`any(${sqlarr(vids.map((x) => x.pk))})`,
					),
				);
		}
		const links = await linkVideos(tx, vidEntries);

		return vids.map((x) => ({
			id: x.id,
			path: x.path,
			guess: x.guess,
			entries: links[x.pk] ?? [],
		}));
	});
}

export const videosWriteH = new Elysia({ prefix: "/videos", tags: ["videos"] })
	.model({
		video: Video,
		"created-videos": t.Array(CreatedVideo),
		error: t.Object({}),
	})
	.use(auth)
	.post(
		"",
		async ({ body, status }) => {
			const ret = await createVideos(body, false);
			if ("status" in ret) return status(ret.status, ret);
			return status(201, ret);
		},
		{
			detail: {
				description: comment`
					Create videos in bulk.
					Duplicated videos will simply be ignored.

					The \`for\` field of each video can be used to link the video to an existing entry.

					If the video was already registered, links will be merged (existing and new ones will be kept).
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
				422: KError,
			},
		},
	)
	.put(
		"",
		async ({ body, status }) => {
			const ret = await createVideos(body, true);
			if ("status" in ret) return status(ret.status, ret);
			return status(201, ret);
		},
		{
			detail: {
				description: comment`
					Create videos in bulk.
					Duplicated videos will simply be ignored.

					The \`for\` field of each video can be used to link the video to an existing entry.

					If the video was already registered, links will be overriden (existing will be removed and new ones will be created).
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
				422: KError,
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
