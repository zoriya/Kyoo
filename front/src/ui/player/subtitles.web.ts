import Jassub from "jassub";
import { PgsRenderer } from "libpgs";
import type { VideoPlayer } from "react-native-video";

declare module "react-native-video" {
	interface VideoPlayer {
		__getNativeRef(): HTMLVideoElement;
		__ass: {
			jassub?: Jassub;
			fonts: string[];
		};
		__pgs?: PgsRenderer;
		__currentId?: string;
		__unselect?: (newMode?: string) => void;
	}
}

export const enhanceSubtitles = (player: VideoPlayer) => {
	player.__ass = { fonts: [] };

	const select = player.selectTextTrack.bind(player);
	player.selectTextTrack = async (track) => {
		player.__currentId = undefined;

		if (!track) {
			player.__unselect?.();
			return;
		}

		// on the web, track.id is the url of the subtitle.
		const newMode = track.id.substring(track.id.length - 3);
		player.__unselect?.(newMode);

		switch (newMode) {
			case "vtt":
				select(track);
				player.__unselect = (newMode) => {
					if (newMode !== "vtt") select(null);
				};
				break;
			case "ass":
				player.__currentId = track.id;
				if (!player.__ass.jassub) {
					player.__ass.jassub = new Jassub({
						video: player.__getNativeRef(),
						workerUrl: "/jassub/jassub-worker.js",
						wasmUrl: "/jassub/jassub-worker.wasm",
						legacyWasmUrl: "/jassub/jassub-worker.wasm.js",
						modernWasmUrl: "/jassub/jassub-worker-modern.wasm",
						subUrl: track.id,
						fonts: player.__ass.fonts,
						availableFonts: {
							"liberation sans": "/jassub/default.woff2",
						},
						fallbackFont: "liberation sans",
					});
				} else {
					player.__ass.jassub.freeTrack();
					player.__ass.jassub.setTrackByUrl(track.id);
				}

				player.__unselect = (newMode) => {
					if (newMode !== "ass") {
						player.__ass.jassub?.destroy();
						player.__ass.jassub = undefined;
						player.__currentId = undefined;
					}
				};
				break;
			case "sup":
				player.__currentId = track.id;

				if (!player.__pgs) {
					player.__pgs = new PgsRenderer({
						workerUrl: "/pgs/libpgs.worker.js",
						video: player.__getNativeRef(),
						subUrl: track.id,
					});
				} else {
					player.__pgs.loadFromUrl(track.id);
				}

				player.__unselect = (newMode) => {
					if (newMode !== "pgs") {
						player.__pgs?.dispose();
						player.__pgs = undefined;
					}
				};
				break;
			default:
				console.log("invalid track url", track?.id);
				break;
		}
	};

	const getAvailable = player.getAvailableTextTracks.bind(player);
	player.getAvailableTextTracks = () => {
		const ret = getAvailable();
		if (player.__currentId) {
			const current = ret.find((x) => x.id === player.__currentId);
			if (current) current.selected = true;
		}
		return ret;
	};
	return player;
};
