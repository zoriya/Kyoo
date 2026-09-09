import { Entry } from "~/models";
import { type Complete, kyooCollection } from "./kyoo";
import type { FieldMap } from "./odata";
import { shows } from "./shows";

type DistOmit<T, K extends PropertyKey> = T extends unknown
	? Omit<T, K>
	: never;

/** An episode, movie entry or special. Its show is referenced by id and slug. */
export type EntryRow = Complete<
	DistOmit<Entry, "show"> & { showId?: string; showSlug?: string }
>;

export const entryFields: FieldMap = {
	kind: "kind",
	seasonNumber: "seasonNumber",
	episodeNumber: "episodeNumber",
	number: "episodeNumber",
	order: "order",
	runtime: "runtime",
	airDate: "airDate",
	content: "content",
	availableSince: "availableSince",
	isAvailable: { path: ["availableSince"], nullFlag: true },
	playedDate: { path: ["progress", "playedDate"], ignoreNull: true },
};

export const entries = kyooCollection<Entry, EntryRow>({
	id: "entries",
	item: Entry,
	getKey: (x) => x.id,
	fields: entryFields,
	routes: [
		{ path: "/api/series/:show/entries", bind: { show: "showSlug" } },
		// "what's new": entries with a video, most recent first
		{
			path: "/api/news",
			when: ({ sort }) => sort[0] === "-availableSince",
			sortable: false,
		},
		// "continue watching": ordered by when the user played them
		{
			path: "/api/profiles/me/history",
			when: ({ sort }) => sort[0]?.endsWith("playedDate") ?? false,
		},
	],
	indexes: [
		(e) => e.slug,
		(e) => e.order,
		(e) => e.availableSince,
		(e) => e.progress.playedDate,
	],
	normalize: (entry, { client }) => {
		const { show, ...rest } = entry;
		if (show) {
			client
				.collection(shows)
				.utils.writer()
				.upsert([show as never]);
		}
		return { ...rest, showId: show?.id, showSlug: show?.slug };
	},
	// Progress edits (mark as seen) go through the history route; the parent
	// show is then re-fetched since its watch status and next entry moved.
	onUpdate: async ({ mutations, api, client }) => {
		const progress = mutations.filter((m) => "progress" in m.changes);
		if (!progress.length) return;
		await api(
			"POST",
			["api", "profiles", "me", "history"],
			progress.map((m) => ({
				percent: m.modified.progress.percent,
				time: m.modified.progress.time,
				entry: m.modified.slug,
				videoId: m.modified.progress.videoId,
				playedDate: m.modified.progress.playedDate?.toISOString() ?? null,
				external: true,
			})),
		);
		const showsC = client.collection(shows);
		await Promise.all(
			[...new Set(progress.map((m) => m.modified.showId))].map((id) => {
				const show = id ? showsC.get(id) : undefined;
				return show && showsC.utils.reload(show);
			}),
		);
	},
});
