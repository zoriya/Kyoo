import { useController } from "@data-client/react";
import { useEffect, useEffectEvent } from "react";
import { usePlayer, usePlayerState } from "react-native-omni";
import { useWebsockets } from "~/data";
import { Entry } from "~/models";

export const useProgressObserver = (
	ids: { videoId: string; entryId: string; kind: Entry["kind"] } | null,
) => {
	const player = usePlayer();
	const ctrl = useController();
	const { sendJsonMessage } = useWebsockets({
		filterActions: ["watch"],
	});
	const isPlaying = usePlayerState("isPlaying");

	const updateProgress = useEffectEvent(() => {
		if (
			ids === null ||
			Number.isNaN(player.currentTime) ||
			Number.isNaN(player.duration)
		)
			return;
		const progress = {
			videoId: ids.videoId,
			percent: Math.round((player.currentTime / player.duration) * 100),
			time: Math.round(player.currentTime),
		};
		sendJsonMessage({ action: "watch", entry: ids.entryId, ...progress });
		ctrl.set(
			Entry,
			{ id: ids.entryId, kind: ids.kind },
			{
				id: ids.entryId,
				kind: ids.kind,
				progress: { ...progress, playedDate: new Date().toISOString() },
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
