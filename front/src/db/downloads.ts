import {
	collectionOptions,
	type DbClient,
	localOnlyCollectionOptions,
} from "@tanstack/react-db";
import { z } from "zod/v4";
import { withPersistence } from "./persistence";

/**
 * Local only state about videos, never sent to the server.
 *
 * This is the pattern for client side fields: instead of adding a field on a
 * synced row (a re-fetch would erase it), keep a side collection keyed by the
 * synced row's id and join it in the live query. Persisted like the rest.
 */
export const Download = z.object({
	videoId: z.string(),
	/** Slug of the entry it was downloaded for (routing/display). */
	entrySlug: z.string().nullable(),
	/** Where the file lives on the device. */
	path: z.string(),
	status: z.enum(["queued", "downloading", "done", "failed"]),
	/** 0-100 */
	progress: z.int().min(0).max(100),
	size: z.int().min(0).nullable(),
	createdAt: z.date(),
});
export type Download = z.infer<typeof Download>;

export const downloads = collectionOptions("downloads", (client: DbClient) =>
	withPersistence(
		client,
		localOnlyCollectionOptions({
			id: "downloads",
			schema: Download,
			getKey: (x) => x.videoId,
		}),
	),
);
