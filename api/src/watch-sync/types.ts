import type { WatchlistStatus } from "~/models/watchlist";

export const WATCH_SYNC_BACKENDS = ["myanimelist"] as const;
export type WatchSyncBackendId = (typeof WATCH_SYNC_BACKENDS)[number];

export type ExternalWatchItem = {
	id: string;
	status: WatchlistStatus;
	score: number | null;
	seenCount: number;
	startedAt: Date | null;
	completedAt: Date | null;
	updatedAt: Date | null;
};

export type WatchSyncItem = {
	profilePk: number;
	showPk: number;
	kind: "movie" | "serie";
	externalId: string;
	status: WatchlistStatus;
	score: number | null;
	seenCount: number;
	percent: number;
	startedAt: Date | null;
	completedAt: Date | null;
};

export type WatchSyncUser = {
	userId: string;
	authorization: string;
	claims: Record<string, unknown>;
	oidc: Record<
		string,
		{
			id: string;
			username: string;
			profileUrl: string | null;
		}
	>;
};

export interface WatchSyncBackend {
	id: WatchSyncBackendId;
	externalIdKeys?: string[];
	getExternalList(
		user: WatchSyncUser,
		since?: Date,
	): Promise<ExternalWatchItem[]>;
	syncList(user: WatchSyncUser, items: WatchSyncItem[]): Promise<void>;
	startWatching?(user: WatchSyncUser, item: WatchSyncItem): Promise<void>;
	endWatching?(user: WatchSyncUser, item: WatchSyncItem): Promise<void>;
	isEnabledForUser?(user: WatchSyncUser): boolean;
}

export type WatchSyncResult = {
	attempted: number;
	synced: number;
	failed: number;
	skipped: number;
	backends: Record<
		WatchSyncBackendId,
		{
			attempted: number;
			synced: number;
			failed: number;
			skipped: number;
		}
	>;
};
