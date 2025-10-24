import { useEffect } from "react";
import { Platform } from "react-native";
import type { VideoPlayer } from "react-native-video";
import type { Subtitle } from "~/models";
import { toggleFullscreen } from "./controls/misc";

type Action =
	| { type: "play" }
	| { type: "mute" }
	| { type: "fullscreen" }
	| { type: "seek"; value: number }
	| { type: "seekTo"; value: number }
	| { type: "seekPercent"; value: number }
	| { type: "volume"; value: number }
	| { type: "subtitle"; subtitles: Subtitle[]; fonts: string[] };

const reducer = (player: VideoPlayer, action: Action) => {
	switch (action.type) {
		case "play":
			if (player.isPlaying) player.pause();
			else player.play();
			break;
		case "mute":
			player.muted = !player.muted;
			break;
		case "fullscreen":
			toggleFullscreen();
			break;
		case "seek":
			player.seekBy(action.value);
			break;
		case "seekTo":
			player.seekTo(action.value);
			break;
		case "seekPercent":
			player.seekTo((player.duration * action.value) / 100);
			break;
		case "volume":
			player.volume = Math.max(0, Math.min(player.volume + action.value, 100));
			break;
		// case "subtitle": {
		// 	const subtitle = get(subtitleAtom);
		// 	const index = subtitle
		// 		? action.subtitles.findIndex((x) => x.index === subtitle.index)
		// 		: -1;
		// 	set(
		// 		subtitleAtom,
		// 		index === -1
		// 			? null
		// 			: action.subtitles[(index + 1) % action.subtitles.length],
		// 	);
		// 	break;
		// }
	}
};

export const useKeyboard = (
	player: VideoPlayer,
	playPrev: () => void,
	playNext: () => void,
	// subtitles?: Subtitle[],
	// fonts?: string[],
) => {
	useEffect(() => {
		if (Platform.OS !== "web") return;
		const handler = (event: KeyboardEvent) => {
			if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey)
				return;

			switch (event.key) {
				case " ":
				case "k":
				case "MediaPlay":
				case "MediaPause":
				case "MediaPlayPause":
					reducer(player, { type: "play" });
					break;

				case "m":
					reducer(player, { type: "mute" });
					break;

				case "ArrowLeft":
					reducer(player, { type: "seek", value: -5 });
					break;
				case "ArrowRight":
					reducer(player, { type: "seek", value: +5 });
					break;

				case "j":
					reducer(player, { type: "seek", value: -10 });
					break;
				case "l":
					reducer(player, { type: "seek", value: +10 });
					break;

				case "ArrowUp":
					reducer(player, { type: "volume", value: +0.05 });
					break;
				case "ArrowDown":
					reducer(player, { type: "volume", value: -0.05 });
					break;

				case "f":
					reducer(player, { type: "fullscreen" });
					break;

				// case "v":
				// case "c":
				// 	if (!subtitles || !fonts) return;
				// 	reducer(player, { type: "subtitle", subtitles, fonts });
				// 	break;

				case "n":
				case "N":
					playNext();
					break;

				case "p":
				case "P":
					playPrev();
					break;

				default:
					break;
			}
			switch (event.code) {
				case "Digit0":
					reducer(player, { type: "seekPercent", value: 0 });
					break;
				case "Digit1":
					reducer(player, { type: "seekPercent", value: 10 });
					break;
				case "Digit2":
					reducer(player, { type: "seekPercent", value: 20 });
					break;
				case "Digit3":
					reducer(player, { type: "seekPercent", value: 30 });
					break;
				case "Digit4":
					reducer(player, { type: "seekPercent", value: 40 });
					break;
				case "Digit5":
					reducer(player, { type: "seekPercent", value: 50 });
					break;
				case "Digit6":
					reducer(player, { type: "seekPercent", value: 60 });
					break;
				case "Digit7":
					reducer(player, { type: "seekPercent", value: 70 });
					break;
				case "Digit8":
					reducer(player, { type: "seekPercent", value: 80 });
					break;
				case "Digit9":
					reducer(player, { type: "seekPercent", value: 90 });
					break;
			}
		};

		document.addEventListener("keyup", handler);
		return () => document.removeEventListener("keyup", handler);
	}, [player, playPrev, playNext]);
};
