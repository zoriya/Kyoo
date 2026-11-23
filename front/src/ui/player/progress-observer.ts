import { useController } from "@data-client/react";
import { useEffect, useEffectEvent } from "react";
import { createMMKV } from "react-native-mmkv";
import { usePlayer, usePlayerState } from "react-native-omni";
import { ReadyState } from "react-use-websocket";
import { useMutation, useWebsockets } from "~/data";
import { Entry } from "~/models";
import { RetryableError } from "~/models/retryable-error";
import { useAccount } from "~/providers/account-context";

// progress that couldn't be sent, by `${accountId}.${entryId}`
const pending = createMMKV({ id: "kyoo-pending-progress" });

export const useProgressObserver = (
	ids: { videoId: string; entryId: string; kind: Entry["kind"] } | null,
) => {
	const player = usePlayer();
	const ctrl = useController();
	const account = useAccount();
	const { sendJsonMessage, readyState } = useWebsockets({
		filterActions: ["watch"],
	});
	const isPlaying = usePlayerState("isPlaying");

	const updateProgress = useEffectEvent(() => {
		if (
			ids === null ||
			Number.isNaN(player.currentTime) ||
			// 0 while loading, it would send an `Infinity` percent
			!player.duration
		)
			return;
		const progress = {
			videoId: ids.videoId,
			percent: Math.round((player.currentTime / player.duration) * 100),
			time: Math.round(player.currentTime),
		};
		if (readyState === ReadyState.OPEN)
			sendJsonMessage({ action: "watch", entry: ids.entryId, ...progress });
		else if (account) {
			// playing a downloaded video offline, `ProgressSync` sends it later
			pending.set(
				`${account.id}.${ids.entryId}`,
				JSON.stringify({
					entry: ids.entryId,
					...progress,
					playedDate: new Date().toISOString(),
				}),
			);
		}
		ctrl.set(
			Entry,
			{ id: ids.entryId, kind: ids.kind },
			{
				id: ids.entryId,
				kind: ids.kind,
				progress: { ...progress, playedDate: new Date() },
			},
		);
	});

	useEffect(() => {
		updateProgress();
		if (!isPlaying) return;
		const interval = setInterval(updateProgress, 5000);
		return () => clearInterval(interval);
	}, [isPlaying]);
};

// sends the progress made offline once the server can be reached again
export const ProgressSync = () => {
	const account = useAccount();
	const { readyState } = useWebsockets({
		filterActions: [],
		enabled: !!account,
	});
	const { mutate } = useMutation((body: object[]) => ({
		method: "POST",
		path: ["api", "profiles", "me", "history"],
		body,
		invalidate: { path: ["api", "profiles"], nested: true },
	}));

	const flush = useEffectEvent(async () => {
		if (!account) return;
		const prefix = `${account.id}.`;
		const sent = new Map(
			pending
				.getAllKeys()
				.filter((x) => x.startsWith(prefix))
				.map((x) => [x, pending.getString(x)!]),
		);
		if (!sent.size) return;
		const clear = () => {
			for (const [key, value] of sent) {
				// only if no newer progress was made while sending this one
				if (pending.getString(key) === value) pending.remove(key);
			}
		};
		await mutate([...sent.values()].map((x) => JSON.parse(x))).then(
			clear,
			(e) => {
				// the server refused it (deleted entry...), retrying won't help
				if (!(e instanceof RetryableError)) clear();
			},
		);
	});

	useEffect(() => {
		if (readyState === ReadyState.OPEN) flush();
	}, [readyState]);

	return null;
};
