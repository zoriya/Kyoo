import { Elysia, t } from "elysia";
import { Video } from "../models/video";

export const videos = new Elysia({ prefix: "/videos" })
	.model({
		video: Video,
		error: t.Object({}),
	})
	.get("/:id", () => "hello" as unknown as Video, {
		response: { 200: "video" },
	});
