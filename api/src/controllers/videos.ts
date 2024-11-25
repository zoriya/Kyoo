import { Elysia, t } from "elysia";
import { SeedVideo, Video } from "~/models/video";
import { db } from "~/db";
import { videos as videosT } from "~/db/schema";
import { comment } from "~/utils";
import { bubbleVideo } from "~/models/examples";

const CreatedVideo = t.Object({
	id: t.String({ format: "uuid" }),
	path: t.String({ example: bubbleVideo.path }),
});

export const videos = new Elysia({ prefix: "/videos", tags: ["videos"] })
	.model({
		video: Video,
		"created-videos": t.Array(CreatedVideo),
		error: t.Object({}),
	})
	.get("/:id", () => "hello" as unknown as Video, {
		response: { 200: "video" },
	})
	.post(
		"/",
		async ({ body }) => {
			return await db
				.insert(videosT)
				.values(body)
				.onConflictDoNothing()
				.returning({ id: videosT.id, path: videosT.path });
		},
		{
			body: t.Array(SeedVideo),
			response: { 201: "created-videos" },
			detail: {
				description: comment`
					Create videos in bulk.
					Duplicated videos will simply be ignored.
				`,
			},
		},
	);
