import { z } from "zod/v4";

export const Event = z.discriminatedUnion("kind", [
	z.object({
		action: z.enum(["created", "updated", "deleted"]),
		kind: z.enum(["movie", "serie", "collection"]),
		id: z.string(),
		slug: z.string(),
	}),
	z.object({
		action: z.enum(["created", "updated", "deleted"]),
		kind: z.literal("video"),
		id: z.string(),
		path: z.string(),
	}),
	z.object({
		action: z.enum(["created", "deleted"]),
		kind: z.literal("video-link"),
		slug: z.string(),
		show: z.object({
			id: z.string(),
			slug: z.string(),
			kind: z.enum(["movie", "serie"]),
		}),
		entry: z.object({ id: z.string(), slug: z.string() }),
		video: z.object({ id: z.string(), path: z.string() }),
	}),
]);
export type Event = z.infer<typeof Event>;
