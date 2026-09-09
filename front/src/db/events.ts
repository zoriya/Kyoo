import type { DbClient } from "@tanstack/react-db";
import { z } from "zod/v4";
import { zdate } from "~/models/utils/utils";
import { entries } from "./entries";
import { shows } from "./shows";

/**
 * Change notifications pushed by the api over the websocket (`action: "event"`,
 * see `api/src/events.ts`). Applying one patches or re-fetches the local rows;
 * every live query showing them updates on its own.
 */
export const DbEvent = z.discriminatedUnion("collection", [
	z.object({
		collection: z.literal("shows"),
		op: z.enum(["invalidate", "delete"]),
		ids: z.array(z.string()),
	}),
	z.object({
		collection: z.literal("entries"),
		op: z.literal("update"),
		data: z.array(
			z.object({
				id: z.string(),
				progress: z.object({
					percent: z.int().min(0).max(100),
					time: z.int().min(0),
					playedDate: zdate().nullable(),
					videoId: z.string().nullable(),
				}),
			}),
		),
	}),
]);
export type DbEvent = z.infer<typeof DbEvent>;

export const createEventHandler = (
	client: DbClient,
	{ debounce = 1_000 } = {},
) => {
	// A scanner import emits hundreds of "new show" events: refetch once.
	let timer: ReturnType<typeof setTimeout> | undefined;
	const refetchLater = () => {
		if (timer) clearTimeout(timer);
		timer = setTimeout(() => {
			timer = undefined;
			client
				.collection(shows)
				.utils.refetch()
				.catch((e) => console.log("[db] refetch after event failed", e));
		}, debounce);
	};

	return (raw: unknown) => {
		const parsed = DbEvent.safeParse(raw);
		if (!parsed.success) {
			console.log("[db] ignoring malformed event", raw, parsed.error.issues);
			return;
		}
		const event = parsed.data;
		switch (event.collection) {
			case "shows": {
				const showsC = client.collection(shows);
				if (event.op === "delete") {
					showsC.utils.writer().remove(event.ids);
					return;
				}
				for (const id of event.ids) {
					const row = showsC.get(id);
					// Unknown rows may belong to a list we display: refetch first pages.
					if (!row) refetchLater();
					else
						showsC.utils
							.reload(row)
							.catch((e) => console.log(`[db] reload of ${id} failed`, e));
				}
				return;
			}
			case "entries": {
				const w = client.collection(entries).utils.writer();
				w.upsert(event.data.filter((x) => w.get(x.id) !== undefined));
				return;
			}
		}
	};
};
