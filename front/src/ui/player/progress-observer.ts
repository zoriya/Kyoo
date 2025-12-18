import { useCallback, useEffect } from "react";
import { useEvent, type VideoPlayer } from "react-native-video";
import { useWebsockets } from "~/query/websockets";

export const useProgressObserver = (
	player: VideoPlayer,
	ids: { videoId: string; entryId: string } | null,
) => {
	const { sendJsonMessage } = useWebsockets({
		filterActions: ["watch"],
	});

	const updateProgress = useCallback(() => {
		if (
			ids === null ||
			Number.isNaN(player.currentTime) ||
			Number.isNaN(player.duration) ||
			!player.isPlaying
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
		const interval = setInterval(updateProgress, 5000);
		return () => clearInterval(interval);
	}, [updateProgress]);

	useEvent(player, "onPlaybackStateChange", updateProgress);
};
