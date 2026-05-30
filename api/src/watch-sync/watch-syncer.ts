import { getLogger } from "@logtape/logtape";
import { and, eq, inArray, or, sql } from "drizzle-orm";
import { db } from "~/db";
import { entries, entryVideoJoin, shows, videos } from "~/db/schema";
import { watchlist } from "~/db/schema/watchlist";
import { watchSyncBackends } from "./backends";
import type {
	WatchSyncBackend,
	WatchSyncItem,
	WatchSyncResult,
	WatchSyncStatus,
	WatchSyncUser,
} from "./types";

const logger = getLogger();

type ShowExternalIds = Record<
	string,
	Array<{
		dataId?: string;
		serieId?: string;
	}>
>;

type WatchRow = {
	profilePk: number;
	showPk: number;
	kind: "movie" | "serie";
	entriesCount: number;
	externalId: ShowExternalIds;
	status: (typeof watchlist.$inferSelect)["status"];
	score: number | null;
	seenCount: number;
	startedAt: Date | null;
	completedAt: Date | null;
	syncStatus: WatchSyncStatus;
};

function initResult(): WatchSyncResult {
	return {
		attempted: 0,
		synced: 0,
		failed: 0,
		skipped: 0,
		backends: {
			myanimelist: {
				attempted: 0,
				synced: 0,
				failed: 0,
				skipped: 0,
			},
		},
	};
}

async function getSyncUser({
	userId,
	authorization,
}: {
	userId: string;
	authorization: string;
}): Promise<WatchSyncUser> {
	const resp = await fetch(
		new URL(`/auth/users/${userId}`, process.env.AUTH_SERVER ?? "http://auth:4568"),
		{
			headers: {
				Authorization: authorization,
			},
		},
	);
	if (!resp.ok) {
		throw new Error(
			`Could not fetch user '${userId}' for watch sync (status ${resp.status})`,
		);
	}

	const payload = (await resp.json()) as {
		claims?: Record<string, unknown>;
		oidc?: Record<
			string,
			{
				id: string;
				username: string;
				profileUrl: string | null;
			}
		>;
	};

	return {
		userId,
		authorization,
		claims: payload.claims ?? {},
		oidc: payload.oidc ?? {},
	};
}

function getBackendExternalId(backend: WatchSyncBackend, ids: ShowExternalIds): string | null {
	for (const key of backend.externalIdKeys ?? [backend.id]) {
		const ext = ids[key];
		if (!ext?.length) continue;
		const first = ext[0];
		if (first?.dataId) return first.dataId;
		if (first?.serieId) return first.serieId;
	}
	return null;
}

function toPercent(row: WatchRow): number {
	if (row.kind === "movie") {
		return row.seenCount;
	}
	if (row.entriesCount <= 0) return 0;
	return Math.max(0, Math.min(100, Math.round((row.seenCount / row.entriesCount) * 100)));
}

function toSyncItem(
	backend: WatchSyncBackend,
	row: WatchRow,
): WatchSyncItem | null {
	const externalId = getBackendExternalId(backend, row.externalId);
	if (!externalId) return null;

	return {
		profilePk: row.profilePk,
		showPk: row.showPk,
		kind: row.kind,
		externalId,
		status: row.status,
		score: row.score,
		seenCount: row.seenCount,
		percent: toPercent(row),
		startedAt: row.startedAt,
		completedAt: row.completedAt,
	};
}

async function markItemSyncStatus({
	row,
	backend,
	success,
	error,
}: {
	row: WatchRow;
	backend: WatchSyncBackend;
	success: boolean;
	error?: unknown;
}) {
	const now = new Date().toISOString();
	const prev = row.syncStatus?.[backend.id];
	const next: WatchSyncStatus = {
		...(row.syncStatus ?? {}),
		[backend.id]: {
			status: success ? "success" : "failed",
			lastAttemptAt: now,
			lastSuccessAt: success ? now : prev?.lastSuccessAt ?? null,
			error:
				success || !error
					? null
					: error instanceof Error
						? error.message
						: String(error),
		},
	};

	row.syncStatus = next;
	await db
		.update(watchlist)
		.set({ syncStatus: next })
		.where(
			and(
				eq(watchlist.profilePk, row.profilePk),
				eq(watchlist.showPk, row.showPk),
			),
		);
}

async function getWatchRows({
	profilePk,
	showPks,
}: {
	profilePk: number;
	showPks?: number[];
}): Promise<WatchRow[]> {
	return db
		.select({
			profilePk: watchlist.profilePk,
			showPk: watchlist.showPk,
			kind: sql<"movie" | "serie">`${shows.kind}`,
			entriesCount: shows.entriesCount,
			externalId: shows.externalId,
			status: watchlist.status,
			score: watchlist.score,
			seenCount: watchlist.seenCount,
			startedAt: watchlist.startedAt,
			completedAt: watchlist.completedAt,
			syncStatus: watchlist.syncStatus,
		})
		.from(watchlist)
		.innerJoin(shows, eq(shows.pk, watchlist.showPk))
		.where(
			and(
				eq(watchlist.profilePk, profilePk),
				or(eq(shows.kind, "movie"), eq(shows.kind, "serie")),
				showPks?.length ? inArray(watchlist.showPk, showPks) : undefined,
			),
		);
}

async function getWatchRowFromVideo({
	profilePk,
	videoId,
}: {
	profilePk: number;
	videoId: string;
}): Promise<WatchRow | null> {
	const [row] = await db
		.select({
			profilePk: watchlist.profilePk,
			showPk: watchlist.showPk,
			kind: sql<"movie" | "serie">`${shows.kind}`,
			entriesCount: shows.entriesCount,
			externalId: shows.externalId,
			status: watchlist.status,
			score: watchlist.score,
			seenCount: watchlist.seenCount,
			startedAt: watchlist.startedAt,
			completedAt: watchlist.completedAt,
			syncStatus: watchlist.syncStatus,
		})
		.from(videos)
		.innerJoin(entryVideoJoin, eq(entryVideoJoin.videoPk, videos.pk))
		.innerJoin(entries, eq(entries.pk, entryVideoJoin.entryPk))
		.innerJoin(shows, eq(shows.pk, entries.showPk))
		.innerJoin(
			watchlist,
			and(eq(watchlist.showPk, shows.pk), eq(watchlist.profilePk, profilePk)),
		)
		.where(and(eq(videos.id, videoId), or(eq(shows.kind, "movie"), eq(shows.kind, "serie"))))
		.limit(1);
	return row ?? null;
}

export async function syncWatchlistToBackends({
	profilePk,
	userId,
	authorization,
	showPks,
}: {
	profilePk: number;
	userId: string;
	authorization: string;
	showPks?: number[];
}): Promise<WatchSyncResult> {
	const result = initResult();
	if (!authorization) return result;

	const [rows, user] = await Promise.all([
		getWatchRows({ profilePk, showPks }),
		getSyncUser({ userId, authorization }),
	]);

	for (const backend of watchSyncBackends) {
		if (backend.isEnabledForUser && !backend.isEnabledForUser(user)) {
			result.backends[backend.id].skipped += rows.length;
			result.skipped += rows.length;
			continue;
		}

		for (const row of rows) {
			const item = toSyncItem(backend, row);
			if (!item) {
				result.backends[backend.id].skipped += 1;
				result.skipped += 1;
				continue;
			}

			result.backends[backend.id].attempted += 1;
			result.attempted += 1;
			try {
				await backend.syncList(user, [item]);
				await markItemSyncStatus({ row, backend, success: true });
				result.backends[backend.id].synced += 1;
				result.synced += 1;
			} catch (err) {
				logger.warn("Failed to sync show {showPk} with backend {backend}: {err}", {
					showPk: row.showPk,
					backend: backend.id,
					err,
				});
				await markItemSyncStatus({ row, backend, success: false, error: err });
				result.backends[backend.id].failed += 1;
				result.failed += 1;
			}
		}
	}

	return result;
}

async function importFromBackend({
	backend,
	profilePk,
	user,
	since,
}: {
	backend: WatchSyncBackend;
	profilePk: number;
	user: WatchSyncUser;
	since?: Date;
}) {
	if (backend.isEnabledForUser && !backend.isEnabledForUser(user)) {
		return { fetched: 0, matched: 0, upserted: 0, skipped: 0 };
	}

	const ext = await backend.getExternalList(user, since);
	if (!ext.length) {
		return { fetched: 0, matched: 0, upserted: 0, skipped: 0 };
	}

	const showRows = await db
		.select({
			pk: shows.pk,
			kind: sql<"movie" | "serie">`${shows.kind}`,
			externalId: shows.externalId,
		})
		.from(shows)
		.where(or(eq(shows.kind, "movie"), eq(shows.kind, "serie")));

	const showByExt = new Map<string, (typeof showRows)[number]>();
	for (const show of showRows) {
		const id = getBackendExternalId(backend, show.externalId as ShowExternalIds);
		if (id) showByExt.set(id, show);
	}

	const toUpsert: (typeof watchlist.$inferInsert)[] = [];
	let matched = 0;
	for (const item of ext) {
		const show = showByExt.get(item.id);
		if (!show) continue;
		matched += 1;
		const seenCount =
			show.kind === "movie"
				? item.status === "completed"
					? 100
					: 0
				: item.seenCount;

		toUpsert.push({
			profilePk,
			showPk: show.pk,
			status: item.status,
			score: item.score,
			seenCount,
			nextEntry: null,
			startedAt: item.startedAt,
			completedAt: item.completedAt,
			lastPlayedAt: item.updatedAt ?? item.completedAt ?? item.startedAt,
		});
	}

	if (toUpsert.length > 0) {
		await db
			.insert(watchlist)
			.values(toUpsert)
			.onConflictDoUpdate({
				target: [watchlist.profilePk, watchlist.showPk],
				set: {
					status: sql`excluded.status`,
					score: sql`excluded.score`,
					seenCount: sql`excluded.seen_count`,
					startedAt: sql`coalesce(excluded.started_at, ${watchlist.startedAt})`,
					completedAt: sql`coalesce(excluded.completed_at, ${watchlist.completedAt})`,
					lastPlayedAt: sql`coalesce(excluded.last_played_at, ${watchlist.lastPlayedAt})`,
				},
			});
	}

	return {
		fetched: ext.length,
		matched,
		upserted: toUpsert.length,
		skipped: ext.length - matched,
	};
}

export async function resyncWatchlist({
	profilePk,
	userId,
	authorization,
	since,
}: {
	profilePk: number;
	userId: string;
	authorization: string;
	since?: Date;
}) {
	const user = await getSyncUser({ userId, authorization });

	const pulled = {
		fetched: 0,
		matched: 0,
		upserted: 0,
		skipped: 0,
	};
	for (const backend of watchSyncBackends) {
		try {
			const ret = await importFromBackend({
				backend,
				profilePk,
				user,
				since,
			});
			pulled.fetched += ret.fetched;
			pulled.matched += ret.matched;
			pulled.upserted += ret.upserted;
			pulled.skipped += ret.skipped;
		} catch (err) {
			logger.warn("Failed to import watchlist from backend {backend}: {err}", {
				backend: backend.id,
				err,
			});
		}
	}

	const pushed = await syncWatchlistToBackends({
		profilePk,
		userId,
		authorization,
	});

	return { pulled, pushed };
}

export async function syncRealtimeWatchEvent({
	profilePk,
	userId,
	authorization,
	videoId,
	fromPercent,
	toPercent,
}: {
	profilePk: number;
	userId: string;
	authorization: string;
	videoId: string;
	fromPercent: number;
	toPercent: number;
}) {
	if (!authorization) return;
	const shouldStart = fromPercent < 5 && toPercent >= 5;
	const shouldEnd = fromPercent < 95 && toPercent >= 95;
	if (!shouldStart && !shouldEnd) return;

	const row = await getWatchRowFromVideo({ profilePk, videoId });
	if (!row) return;

	const user = await getSyncUser({ userId, authorization });
	for (const backend of watchSyncBackends) {
		if (backend.isEnabledForUser && !backend.isEnabledForUser(user)) continue;
		const item = toSyncItem(backend, row);
		if (!item) continue;

		try {
			if (shouldEnd && backend.endWatching) {
				await backend.endWatching(user, item);
			} else if (shouldStart && backend.startWatching) {
				await backend.startWatching(user, item);
			} else {
				await backend.syncList(user, [item]);
			}
			await markItemSyncStatus({ row, backend, success: true });
		} catch (err) {
			logger.warn(
				"Failed realtime watch sync show={showPk} backend={backend}: {err}",
				{
					showPk: row.showPk,
					backend: backend.id,
					err,
				},
			);
			await markItemSyncStatus({ row, backend, success: false, error: err });
		}
	}
}

export async function getTouchedShowPks(entryPks: number[]): Promise<number[]> {
	if (entryPks.length === 0) return [];
	const rows = await db
		.selectDistinct({ showPk: entries.showPk })
		.from(entries)
		.where(inArray(entries.pk, entryPks));
	return rows.map((x) => x.showPk);
}
