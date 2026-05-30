import { getLogger } from "@logtape/logtape";
import type {
	ExternalWatchItem,
	WatchSyncBackend,
	WatchSyncItem,
	WatchSyncUser,
} from "../types";
import type { WatchlistStatus } from "~/models/watchlist";

const logger = getLogger();

type MalStatus =
	| "watching"
	| "completed"
	| "on_hold"
	| "dropped"
	| "plan_to_watch";

const MAL_API = process.env.WATCH_SYNC_MAL_API ?? "https://api.myanimelist.net/v2";
const MAL_PROVIDER = process.env.WATCH_SYNC_MAL_PROVIDER ?? "myanimelist";

function toDateOnly(date: Date | null): string | null {
	if (!date) return null;
	return date.toISOString().slice(0, 10);
}

function mapMalStatus(status: MalStatus): WatchlistStatus {
	switch (status) {
		case "watching":
			return "watching";
		case "completed":
			return "completed";
		case "dropped":
			return "dropped";
		case "on_hold":
			return "dropped";
		case "plan_to_watch":
			return "planned";
	}
}

function toMalStatus(status: WatchlistStatus): MalStatus {
	switch (status) {
		case "watching":
		case "rewatching":
			return "watching";
		case "completed":
			return "completed";
		case "dropped":
			return "dropped";
		case "planned":
			return "plan_to_watch";
	}
}

function watchedEpisodes(item: WatchSyncItem): number {
	if (item.kind === "movie") {
		return item.percent >= 95 || item.status === "completed" ? 1 : 0;
	}
	return item.seenCount;
}

async function getMalAccessToken(user: WatchSyncUser): Promise<string> {
	const tokenUrl = new URL(
		`/auth/users/${user.userId}/oidc-tokens/${MAL_PROVIDER}`,
		process.env.AUTH_SERVER ?? "http://auth:4568",
	);
	const tokenResp = await fetch(tokenUrl, {
		headers: {
			Authorization: user.authorization,
		},
	});
	if (!tokenResp.ok) {
		throw new Error(
			`Could not fetch MAL token for user '${user.userId}' (status: ${tokenResp.status})`,
		);
	}
	const payload = (await tokenResp.json()) as {
		accessToken?: string;
		access_token?: string;
		token?: string;
	};
	const token = payload.accessToken ?? payload.access_token ?? payload.token;
	if (!token) {
		throw new Error(`Invalid MAL token payload for user '${user.userId}'`);
	}
	return token;
}

async function syncOneItem(token: string, item: WatchSyncItem) {
	const params = new URLSearchParams();
	params.set("status", toMalStatus(item.status));
	params.set("num_watched_episodes", watchedEpisodes(item).toString());
	if (item.score !== null) {
		params.set("score", item.score.toString());
	}
	const startedAt = toDateOnly(item.startedAt);
	if (startedAt) {
		params.set("start_date", startedAt);
	}
	const completedAt = toDateOnly(item.completedAt);
	if (completedAt) {
		params.set("finish_date", completedAt);
	}

	const resp = await fetch(`${MAL_API}/anime/${item.externalId}/my_list_status`, {
		method: "PATCH",
		headers: {
			Authorization: `Bearer ${token}`,
			"Content-Type": "application/x-www-form-urlencoded",
		},
		body: params,
	});

	if (!resp.ok) {
		const body = await resp.text();
		throw new Error(
			`MAL sync failed for anime ${item.externalId} (status ${resp.status}): ${body}`,
		);
	}
}

type MalListResp = {
	data: {
		node: {
			id: number;
		};
		list_status: {
			status: MalStatus;
			score: number;
			num_episodes_watched: number;
			start_date: string | null;
			finish_date: string | null;
			updated_at: string;
		};
	}[];
	paging?: {
		next?: string;
	};
};

export const myanimelistBackend: WatchSyncBackend = {
	id: "myanimelist",
	externalIdKeys: ["myanimelist", "mal"],
	isEnabledForUser(user) {
		return MAL_PROVIDER in user.oidc;
	},
	async getExternalList(user, since) {
		const token = await getMalAccessToken(user);
		const ret: ExternalWatchItem[] = [];
		let url: string | undefined = `${MAL_API}/users/@me/animelist?fields=list_status&limit=1000`;

		while (url) {
			const resp = await fetch(url, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});
			if (!resp.ok) {
				const body = await resp.text();
				throw new Error(
					`MAL getExternalList failed (status ${resp.status}): ${body}`,
				);
			}
			const payload = (await resp.json()) as MalListResp;
			for (const item of payload.data) {
				const updatedAt = new Date(item.list_status.updated_at);
				if (since && updatedAt < since) continue;
				ret.push({
					id: item.node.id.toString(),
					status: mapMalStatus(item.list_status.status),
					score: item.list_status.score > 0 ? item.list_status.score : null,
					seenCount: item.list_status.num_episodes_watched,
					startedAt: item.list_status.start_date
						? new Date(item.list_status.start_date)
						: null,
					completedAt: item.list_status.finish_date
						? new Date(item.list_status.finish_date)
						: null,
					updatedAt,
				});
			}
			url = payload.paging?.next;
		}

		return ret;
	},
	async syncList(user, items) {
		const token = await getMalAccessToken(user);
		for (const item of items) {
			await syncOneItem(token, item);
		}
	},
	async startWatching(user, item) {
		const token = await getMalAccessToken(user);
		await syncOneItem(token, {
			...item,
			status: "watching",
		});
	},
	async endWatching(user, item) {
		const token = await getMalAccessToken(user);
		await syncOneItem(token, {
			...item,
			status: "completed",
			completedAt: item.completedAt ?? new Date(),
		});
	},
};

logger.debug("MyAnimeList watch sync backend loaded");
