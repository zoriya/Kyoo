import Jassub from "jassub";
import type { VideoPlayer } from "react-native-video";

declare module "react-native-video" {
	interface VideoPlayer {
		__getNativeRef(): HTMLVideoElement;
		__ass: {
			currentId?: string;
			jassub?: Jassub;
			fonts: string[];
		};
	}
}

export const enhanceSubtitles = (player: VideoPlayer) => {
	player.__ass = { fonts: [] };

	const select = player.selectTextTrack.bind(player);
	player.selectTextTrack = (track) => {
		player.__ass.currentId = undefined;

		// on the web, track.id is the url of the subtitle.
		if (!track || !track.id.endsWith(".ass")) {
			player.__ass.jassub?.destroy();
			player.__ass.jassub = undefined;
			select(track);
			return;
		}

		// since we'll use a custom renderer for ass, disable the existing sub
		select(null);
		player.__ass.currentId = track.id;
		if (!player.__ass.jassub) {
			player.__ass.jassub = new Jassub({
				video: player.__getNativeRef(),
				workerUrl: "/jassub/jassub-worker.js",
				wasmUrl: "/jassub/jassub-worker.wasm",
				legacyWasmUrl: "/jassub/jassub-worker.wasm.js",
				modernWasmUrl: "/jassub/jassub-worker-modern.wasm",
				// Disable offscreen renderer due to bugs on firefox and chrome android
				// (see https://github.com/ThaUnknown/jassub/issues/31)
				// offscreenRender: false,
				subUrl: track.id,
				fonts: player.__ass.fonts,
			});
		} else {
			player.__ass.jassub.freeTrack();
			player.__ass.jassub.setTrackByUrl(track.id);
		}
	};

	const getAvailable = player.getAvailableTextTracks.bind(player);
	player.getAvailableTextTracks = () => {
		const ret = getAvailable();
		if (player.__ass.currentId) {
			const current = ret.find((x) => x.id === player.__ass.currentId);
			if (current) current.selected = true;
		}
		return ret;
	};
	return player;
};
