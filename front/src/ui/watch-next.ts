import * as BackgroundTask from "expo-background-task";
import * as TaskManager from "expo-task-manager";
import { AppState } from "react-native";
import { getLanguage } from "react-native-localization-settings";
import { WatchNext, type WatchNextProgram } from "react-native-watch-next";
import { z } from "zod/v4";
import { Entry, Paged } from "~/models";
import { zdate } from "~/models/utils/utils";
import { readAccounts } from "~/providers/account-store";
import { readValue, storeValue } from "~/providers/settings";
import { queryFn } from "~/query";

const Presign = z.object({ signature: z.string(), expireAt: zdate() });

// This runs without any react tree (in the background task), so everything is read from storage.
const syncWatchNext = async () => {
	if (!WatchNext) return;
	const accounts = readAccounts();
	const lang = getLanguage();

	// programs are identified by `account:entry`
	const existing = await WatchNext.list();
	for (const old of existing) {
		if (!accounts.some((x) => old.internalProviderId?.startsWith(`${x.id}:`)))
			await WatchNext.remove(old.id);
	}

	// a server being down shouldn't prevent other accounts from updating (its programs are kept as is)
	const ret = await Promise.allSettled(
		accounts.map(async (account) => {
			if (!WatchNext) return;

			const nextup = await queryFn({
				url: `${account.apiUrl}/api/profiles/me/nextup?limit=10`,
				parser: Paged(Entry),
				authToken: account.token,
				lang,
			});

			// the launcher can't send our auth headers so we give it presigned image urls.
			// they are valid for 7 days, renew them a bit before so the launcher never has a dead link.
			let presign = readValue(`watchNextPresign.${account.id}`, Presign);
			if (
				!presign ||
				presign.expireAt.getTime() < Date.now() + 2 * 24 * 3600_000
			) {
				presign = await queryFn({
					method: "POST",
					url: `${account.apiUrl}/auth/presign`,
					body: {
						for: [{ prefix: "/api/images", verb: "GET" }],
						duration: "168h",
					},
					parser: Presign,
					authToken: account.token,
					lang,
				});
				storeValue(`watchNextPresign.${account.id}`, presign);
			}

			const programs = nextup.items
				.filter((item) => item.href)
				.map((item) => {
					const id = `${account.id}:${item.id}`;
					const image =
						item.kind === "movie"
							? (item.poster ?? item.show?.poster)
							: (item.thumbnail ?? item.show?.thumbnail);
					const duration = item.runtime
						? item.runtime * 60_000
						: item.progress.percent
							? (item.progress.time * 100_000) / item.progress.percent
							: null;
					return {
						internalProviderId: id,
						contentId: id,
						type: item.kind === "movie" ? "movie" : "tvEpisode",
						watchNextType: item.progress.time ? "continue" : "next",
						title: item.show?.name ?? item.name ?? "",
						episodeTitle:
							item.kind !== "movie" ? (item.name ?? undefined) : undefined,
						description: item.description ?? undefined,
						seasonNumber:
							item.kind === "episode" ? item.seasonNumber : undefined,
						episodeNumber:
							item.kind === "episode" ? item.episodeNumber : undefined,
						posterArtUri: image
							? `${account.apiUrl}${image.medium}&x-presign=${presign.signature}`
							: undefined,
						posterArtAspectRatio: item.kind === "movie" ? "2:3" : "16:9",
						intentUri: `kyoo://${item.href}?account=${account.id}`,
						lastPlaybackPositionMillis: item.progress.time * 1000,
						durationMillis: duration ? Math.round(duration) : undefined,
						// entries never played keep the date they were first added, so they don't
						// jump ahead of other apps' programs on every sync.
						lastEngagementTimeUtcMillis:
							item.progress.playedDate?.getTime() ??
							existing.find((x) => x.internalProviderId === id)
								?.lastEngagementTimeUtcMillis ??
							Date.now(),
					} satisfies WatchNextProgram;
				});

			for (const old of existing) {
				if (
					old.internalProviderId?.startsWith(`${account.id}:`) &&
					!programs.some((x) => x.internalProviderId === old.internalProviderId)
				)
					await WatchNext.remove(old.id);
			}
			for (const program of programs) {
				const old = existing.find(
					(x) => x.internalProviderId === program.internalProviderId,
				);
				if (!old) await WatchNext.insert(program);
				else if (old.browsable) await WatchNext.update(old.id, program);
				// the user removed it from the row, only add it back if they watched it again since.
				else if (
					program.lastEngagementTimeUtcMillis >
					(old.lastEngagementTimeUtcMillis ?? 0)
				) {
					await WatchNext.remove(old.id);
					await WatchNext.insert(program);
				}
			}
		}),
	);
	const failed = ret.find((x) => x.status === "rejected");
	if (failed) throw failed.reason;
};

// the background task and the app closing can both trigger a sync, don't run them concurrently.
let running = Promise.resolve();
const refreshWatchNext = () => {
	const ret = running.then(syncWatchNext);
	running = ret.catch(() => {});
	return ret;
};

// everything is in the global scope since the background task runs without rendering the app.
// the dev app is installed alongside the release one, don't fill the row with duplicates.
if (WatchNext && !__DEV__) {
	TaskManager.defineTask("watch-next", async () => {
		try {
			await refreshWatchNext();
			return BackgroundTask.BackgroundTaskResult.Success;
		} catch (e) {
			console.error("Could not update the watch next row", e);
			return BackgroundTask.BackgroundTaskResult.Failed;
		}
	});
	BackgroundTask.registerTaskAsync("watch-next", {
		minimumInterval: 120,
	}).catch((e) => console.error("Could not register the watch next task", e));

	// the user is going back to the launcher, make sure it shows what they just watched.
	AppState.addEventListener("change", (state) => {
		if (state !== "background") return;
		refreshWatchNext().catch((e) =>
			console.error("Could not update the watch next row", e),
		);
	});
}
