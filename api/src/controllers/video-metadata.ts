import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { auth } from "~/auth";
import { db } from "~/db";
import { entryVideoJoin, videos } from "~/db/schema";
import { KError } from "~/models/error";
import { isUuid } from "~/models/utils";
import { Video } from "~/models/video";

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
		async ({ params: { id }, status, redirect }) => {
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
			return redirect(`/video/${path}/info`);
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
		async ({ params: { id }, status, redirect }) => {
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
			return redirect(`/video/${path}/thumbnails.vtt`);
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
		async ({ params: { id }, status, redirect }) => {
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
			const filename = path.substring(path.lastIndexOf("/") + 1);
			return redirect(`/video/${path}/direct/${filename}`);
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
		async ({ params: { id }, request, status, redirect }) => {
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
			const query = request.url.substring(request.url.indexOf("?"));
			return redirect(`/video/${path}/master.m3u8${query}`);
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
	);
