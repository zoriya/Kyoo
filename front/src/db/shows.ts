import {
	and,
	coalesce,
	type DbClient,
	eq,
	type InitialQueryBuilder,
	or,
	type Ref,
} from "@tanstack/react-db";
import { type Movie, type Serie, Show, type WatchStatusV } from "~/models";
import { entries } from "./entries";
import { type Complete, kyooCollection, retype } from "./kyoo";
import type { FieldMap } from "./odata";

/**
 * A serie, movie or collection as stored locally. Nested entries are replaced
 * by ids (they live in `entries`), `playHref` is derived at query time.
 *
 * - `firstEntryId`/`nextEntryId`: `undefined` = relation not loaded, `null` = none.
 * - `collectionSlug`: lets `/collections/:slug/shows` be a plain predicate.
 */
type RowOf<S> = S extends unknown
	? Omit<S, "firstEntry" | "nextEntry" | "playHref"> & {
			firstEntryId?: string | null;
			nextEntryId?: string | null;
			collectionSlug?: string | null;
		}
	: never;
export type ShowRow = Complete<RowOf<Show>>;
export type ShowKind = Show["kind"];

/** Server filter/sort keys of `/api/shows` and friends. */
export const showFields: FieldMap = {
	kind: "kind",
	slug: "slug",
	name: "name",
	status: "status",
	runtime: "runtime",
	startAir: "startAir",
	airDate: "startAir",
	endAir: "endAir",
	createdAt: "createdAt",
	originalLanguage: "original.language",
	genres: { path: ["genres"], array: true },
	tags: { path: ["tags"], array: true },
	watchStatus: "watchStatus.status",
	score: "watchStatus.score",
	lastPlayed: "watchStatus.lastPlayedAt",
	rating: { path: ["rating"], param: true },
	// joined tables: filtered by the api, not locally
	studios: { path: ["studios"], serverOnly: true },
	staff: { path: ["staff"], serverOnly: true },
};

const relations = (kinds: string) => [
	...(kinds !== "collections" ? ["collection", "studios"] : []),
	...(kinds === "series" ? ["firstEntry", "nextEntry"] : []),
	...(kinds === "movies" ? ["videos"] : []),
];
const listRelations = ["firstEntry", "nextEntry"];

export const shows = kyooCollection<Show, ShowRow>({
	id: "shows",
	item: Show,
	getKey: (x) => x.id,
	fields: showFields,
	routes: [
		{
			// `where(and(eq(s.kind, kind), eq(s.slug, slug)))` -> /api/series/:slug
			path: "/api/:kinds/:id",
			single: true,
			bind: {
				kinds: { field: "kind", map: (k: string) => `${k}s`, stamp: false },
				id: { field: ["slug", "id"], stamp: false },
			},
			params: ({ kinds }) => ({ with: relations(kinds!) }),
		},
		{
			path: "/api/collections/:collection/shows",
			bind: { collection: "collectionSlug" },
			params: () => ({ with: listRelations }),
		},
		{
			path: "/api/shows",
			params: () => ({ with: listRelations }),
		},
	],
	indexes: [
		(s) => s.slug,
		(s) => s.name,
		(s) => ("startAir" in s ? s.startAir : undefined),
		(s) => ("watchStatus" in s ? s.watchStatus?.lastPlayedAt : undefined),
	],
	normalize: (show, { client }) => {
		const collectionSlug =
			"collection" in show && show.collection !== undefined
				? (show.collection?.slug ?? null)
				: undefined;
		if (show.kind !== "serie") return { ...show, collectionSlug };

		const { firstEntry, nextEntry, playHref: _, ...rest } = show;
		const nested = [firstEntry, nextEntry].filter((x) => !!x);
		if (nested.length) {
			client
				.collection(entries)
				.utils.writer()
				.upsert(
					nested.map((e) => ({ ...e, showId: show.id, showSlug: show.slug })),
				);
		}
		return {
			...rest,
			collectionSlug,
			firstEntryId:
				firstEntry === undefined ? undefined : (firstEntry?.id ?? null),
			nextEntryId:
				nextEntry === undefined ? undefined : (nextEntry?.id ?? null),
		};
	},
	// The server owns the derived fields (seenCount, nextEntry...): forward the
	// change then pull the authoritative row. TanStack DB rolls back on failure.
	onUpdate: async ({ mutations, api, utils }) => {
		for (const m of mutations) {
			const row = m.modified;
			if ("watchStatus" in m.changes && row.kind !== "collection") {
				const status = row.watchStatus?.status ?? null;
				await api(
					status ? "POST" : "DELETE",
					["api", `${row.kind}s`, row.slug, "watchstatus"],
					status ? { status } : undefined,
				);
			}
		}
		await Promise.all(mutations.map((m) => utils.reload(m.modified)));
	},
	onDelete: async ({ mutations, api }) => {
		for (const m of mutations) {
			const row = m.original as ShowRow;
			await api("DELETE", ["api", `${row.kind}s`, row.slug]);
		}
	},
});

/** A show with its first/next entries re-attached, typed as the `Show` screens expect. */
export const showQuery = (
	q: InitialQueryBuilder,
	kind: ShowKind,
	slug: string,
	// Descriptors resolve through the DbProvider; outside react pass the client.
	client?: DbClient,
) =>
	retype<Show, true>(
		q
			.from({ s: (client ? client.collection(shows) : shows) as typeof shows })
			.leftJoin(
				{
					fe: (client ? client.collection(entries) : entries) as typeof entries,
				},
				({ s, fe }) => eq(s.firstEntryId, fe.id),
			)
			.leftJoin(
				{
					ne: (client ? client.collection(entries) : entries) as typeof entries,
				},
				({ s, ne }) => eq(s.nextEntryId, ne.id),
			)
			.where(({ s }) =>
				and(eq(s.kind, kind), or(eq(s.slug, slug), eq(s.id, slug))),
			)
			.select(({ s, fe, ne }) => ({
				...s,
				firstEntry: fe,
				nextEntry: ne,
				playHref: coalesce(ne.href, fe.href),
			}))
			.findOne(),
	);

/**
 * `s.watchStatus` is nullable and TanStack's ref proxies are not typed to
 * descend into a nullable object: `showWatchStatus(s).status` is the typed way.
 */
export const showWatchStatus = (s: { watchStatus?: unknown }) =>
	s.watchStatus as Ref<
		NonNullable<Serie["watchStatus"] | Movie["watchStatus"]>
	>;

/** New `watchStatus` value for an optimistic update, the server fills the rest. */
export const watchStatusOf = (
	row: ShowRow & { kind: "serie" | "movie" },
	status: WatchStatusV | null,
): Serie["watchStatus"] | Movie["watchStatus"] => {
	if (!status) return null;
	const prev = (row as { watchStatus: unknown }).watchStatus as Record<
		string,
		unknown
	> | null;
	return {
		score: null,
		completedAt: null,
		lastPlayedAt: new Date(),
		...(row.kind === "serie"
			? {
					startedAt: null,
					seenCount: status === "completed" ? row.entriesCount : 0,
				}
			: { percent: status === "completed" ? 100 : 0 }),
		...prev,
		status,
	} as never;
};
