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
	}
}

export const enhanceSubtitles = (player: VideoPlayer) => {
	player.__ass = { fonts: [] };

	const select = player.selectTextTrack.bind(player);
	player.selectTextTrack = async (track) => {
		player.__currentId = undefined;

		// on the web, track.id is the url of the subtitle.
		switch (track?.id.substring(track.id.length - 3)) {
			case null:
			case undefined:
			case "vtt":
				await player.__ass.jassub?.destroy();
				player.__ass.jassub = undefined;

				player.__pgs?.dispose();
				player.__pgs = undefined;

				select(track);
				break;
			case "ass":
				// since we'll use a custom renderer for ass, disable the existing sub
				select(null);
				player.__currentId = track.id;
				player.__pgs?.dispose();
				player.__pgs = undefined;

				if (!player.__ass.jassub) {
					player.__ass.jassub = new Jassub({
						video: player.__getNativeRef(),
						workerUrl: "/jassub/jassub-worker.js",
						wasmUrl: "/jassub/jassub-worker.wasm",
						modernWasmUrl: "/jassub/jassub-worker-modern.wasm",
						subUrl: track.id,
						fonts: player.__ass.fonts,
						availableFonts: {
							"liberation sans": "/jassub/default.woff2",
						},
						fallbackFont: "liberation sans",
					});
					await player.__ass.jassub.ready;
				} else {
					await player.__ass.jassub.ready;
					await player.__ass.jassub.renderer.freeTrack();
					await player.__ass.jassub.renderer.setTrackByUrl(track.id);
				}
				break;
			case "sup":
				select(null);
				player.__currentId = track.id;
				await player.__ass.jassub?.destroy();
				player.__ass.jassub = undefined;

				if (!player.__pgs) {
					player.__pgs = new PgsRenderer({
						workerUrl: "/pgs/libpgs.worker.js",
						video: player.__getNativeRef(),
						subUrl: track.id,
					});
				} else {
					player.__pgs.loadFromUrl(track.id);
				}
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
