import { useCallback, useEffect } from "react";
import { usePlayer, usePlayerState } from "react-native-omni";
import { useWebsockets } from "~/query/websockets";

export const useProgressObserver = (
	ids: { videoId: string; entryId: string } | null,
) => {
	const player = usePlayer();
	const { sendJsonMessage } = useWebsockets({
		filterActions: ["watch"],
	});
	const isPlaying = usePlayerState("isPlaying");

	const updateProgress = useCallback(() => {
		if (
			ids === null ||
			Number.isNaN(player.currentTime) ||
			Number.isNaN(player.duration)
		)
			return;
		sendJsonMessage({
			action: "watch",
			entry: ids.entryId,
			videoId: ids.videoId,
			percent: Math.round((player.currentTime / player.duration) * 100),
			time: Math.round(player.currentTime),
		});
	}, [player, ids, sendJsonMessage]);

	useEffect(() => {
		updateProgress();
		if (!isPlaying) return;
		const interval = setInterval(updateProgress, 5000);
		return () => clearInterval(interval);
	}, [updateProgress, isPlaying]);
};
