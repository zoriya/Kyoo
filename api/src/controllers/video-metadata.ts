import { getLogger } from "@logtape/logtape";
import { and, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import slugify from "slugify";
import { auth } from "~/auth";
import { db } from "~/db";
import { entries, entryVideoJoin, videos } from "~/db/schema";
import { KError } from "~/models/error";
import { isUuid } from "~/models/utils";
import { Video } from "~/models/video";
import { toQueryStr } from "~/utils";

const logger = getLogger();

export const videosMetadata = new Elysia({
	prefix: "/videos",
	tags: ["videos"],
})
	.model({
		video: Video,
		error: t.Object({}),
	})
	.use(auth)
	.get(
		":id/info",
		async ({ params: { id }, query, status, redirect }) => {
			const [video] = await db
				.select({
					path: videos.path,
				})
				.from(videos)
				.leftJoin(entryVideoJoin, eq(videos.pk, entryVideoJoin.videoPk))
				.where(isUuid(id) ? eq(videos.id, id) : eq(entryVideoJoin.slug, id))
				.limit(1);

			if (!video) {
				return status(404, {
					status: 404,
					message: `No video found with id or slug '${id}'`,
				});
			}
			const path = Buffer.from(video.path, "utf8").toString("base64url");
			return redirect(`/video/${path}/info${toQueryStr(query)}`);
		},
		{
			detail: { description: "Get a video's metadata informations" },
			params: t.Object({
				id: t.String({
					description: "The id or slug of the video to retrieve.",
					example: "made-in-abyss-s1e13",
				}),
			}),
			response: {
				302: t.Void({
					description:
						"Redirected to the [/video/{path}/info](?api=transcoder#tag/metadata/get/:path/info) route (of the transcoder)",
				}),
				404: {
					...KError,
					description: "No video found with the given id or slug.",
				},
			},
		},
	)
	.get(
		":id/thumbnails.vtt",
		async ({ params: { id }, query, status, redirect }) => {
			const [video] = await db
				.select({
					path: videos.path,
				})
				.from(videos)
				.leftJoin(entryVideoJoin, eq(videos.pk, entryVideoJoin.videoPk))
				.where(isUuid(id) ? eq(videos.id, id) : eq(entryVideoJoin.slug, id))
				.limit(1);

			if (!video) {
				return status(404, {
					status: 404,
					message: `No video found with id or slug '${id}'`,
				});
			}
			const path = Buffer.from(video.path, "utf8").toString("base64url");
			return redirect(`/video/${path}/thumbnails.vtt${toQueryStr(query)}`);
		},
		{
			detail: {
				description: "Get redirected to the direct stream of the video",
			},
			params: t.Object({
				id: t.String({
					description: "The id or slug of the video to watch.",
					example: "made-in-abyss-s1e13",
				}),
			}),
			response: {
				302: t.Void({
					description:
						"Redirected to the [/video/{path}/direct](?api=transcoder#tag/metadata/get/:path/direct) route (of the transcoder)",
				}),
				404: {
					...KError,
					description: "No video found with the given id or slug.",
				},
			},
		},
	)
	.get(
		":id/direct",
		async ({ params: { id }, query, status, redirect }) => {
			const [video] = await db
				.select({
					path: videos.path,
				})
				.from(videos)
				.leftJoin(entryVideoJoin, eq(videos.pk, entryVideoJoin.videoPk))
				.where(isUuid(id) ? eq(videos.id, id) : eq(entryVideoJoin.slug, id))
				.limit(1);

			if (!video) {
				return status(404, {
					status: 404,
					message: `No video found with id or slug '${id}'`,
				});
			}
			const path = Buffer.from(video.path, "utf8").toString("base64url");
			const filename = video.path.substring(video.path.lastIndexOf("/") + 1);
			return redirect(
				`/video/${path}/direct/${slugify(filename, { lower: true })}${toQueryStr(query)}`,
			);
		},
		{
			detail: {
				description: "Get redirected to the direct stream of the video",
			},
			params: t.Object({
				id: t.String({
					description: "The id or slug of the video to watch.",
					example: "made-in-abyss-s1e13",
				}),
			}),
			response: {
				302: t.Void({
					description:
						"Redirected to the [/video/{path}/direct](?api=transcoder#tag/metadata/get/:path/direct) route (of the transcoder)",
				}),
				404: {
					...KError,
					description: "No video found with the given id or slug.",
				},
			},
		},
	)
	.get(
		":id/master.m3u8",
		async ({ params: { id }, query, status, redirect }) => {
			const [video] = await db
				.select({
					path: videos.path,
				})
				.from(videos)
				.leftJoin(entryVideoJoin, eq(videos.pk, entryVideoJoin.videoPk))
				.where(isUuid(id) ? eq(videos.id, id) : eq(entryVideoJoin.slug, id))
				.limit(1);

			if (!video) {
				return status(404, {
					status: 404,
					message: `No video found with id or slug '${id}'`,
				});
			}
			const path = Buffer.from(video.path, "utf8").toString("base64url");
			return redirect(`/video/${path}/master.m3u8${toQueryStr(query)}`);
		},
		{
			detail: { description: "Get redirected to the master.m3u8 of the video" },
			params: t.Object({
				id: t.String({
					description: "The id or slug of the video to watch.",
					example: "made-in-abyss-s1e13",
				}),
			}),
			response: {
				302: t.Void({
					description:
						"Redirected to the [/video/{path}/master.m3u8](?api=transcoder#tag/metadata/get/:path/master.m3u8) route (of the transcoder)",
				}),
				404: {
					...KError,
					description: "No video found with the given id or slug.",
				},
			},
		},
	)
	.get(
		":id/prepare",
		async ({ params: { id }, headers: { authorization }, status }) => {
			const ret = await prepareVideo(id, authorization!);
			if ("kyoo" in ret) return status(ret.status, ret as any);
			return { status: ret.status, body: await ret.json() };
		},
		{
			detail: { description: "Prepare a video for playback" },
			params: t.Object({
				id: t.String({
					description: "The id or slug of the video to watch.",
					example: "made-in-abyss-s1e13",
				}),
			}),
			response: {
				200: t.Any({
					description:
						"Prepare said video for playback (compute everything possible and cache it)",
				}),
				404: {
					...KError,
					description: "No video found with the given id or slug.",
				},
			},
		},
	);

export const prepareVideo = async (slug: string, auth: string) => {
	const [vid] = await db
		.select({ path: videos.path, show: entries.showPk, order: entries.order })
		.from(videos)
		.innerJoin(entryVideoJoin, eq(videos.pk, entryVideoJoin.videoPk))
		.leftJoin(entries, eq(entries.pk, entryVideoJoin.entryPk))
		.where(eq(entryVideoJoin.slug, slug))
		.limit(1);

	if (!vid) {
		return {
			kyoo: true,
			status: 404,
			message: `No video found with slug ${slug}`,
		} as const;
	}

	const related = vid.show
		? await db
				.select({ order: entries.order, path: videos.path })
				.from(entries)
				.innerJoin(entryVideoJoin, eq(entries.pk, entryVideoJoin.entryPk))
				.innerJoin(videos, eq(videos.pk, entryVideoJoin.videoPk))
				.where(and(eq(entries.showPk, vid.show), eq(entries.kind, "episode")))
				.orderBy(entries.order)
		: [];
	const idx = related.findIndex((x) => x.order === vid.order);
	const prev = related[idx - 1]?.path;
	const next = related[idx + 1]?.path;

	logger.info("Preparing next video {slug} (near episodes: {near})", {
		slug,
		near: [prev, next],
	});

	const path = Buffer.from(vid.path, "utf8").toString("base64url");
	const params = {
		prev: prev ? Buffer.from(prev, "utf8").toString("base64url") : null,
		next: next ? Buffer.from(next, "utf8").toString("base64url") : null,
	};
	return await fetch(
		new URL(
			`/video/${path}/prepare${toQueryStr(params)}`,
			process.env.TRANSCODER_SERVER ?? "http://transcoder:7666",
		),
		{
			headers: {
				authorization: auth,
				"content-type": "application/json",
			},
		},
	);
};
