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
	player.selectTextTrack = async (track) => {
		player.__ass.currentId = undefined;

		// on the web, track.id is the url of the subtitle.
		if (!track || !track.id.endsWith(".ass")) {
			await player.__ass.jassub?.destroy();
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
				modernWasmUrl: "/jassub/jassub-worker-modern.wasm",
				subUrl: track.id,
				fonts: player.__ass.fonts,
				availableFonts: {
					"liberation sans": "/jassub/default.woff2",
				},
				debug: true,
				fallbackFont: "liberation sans",
			});
			await player.__ass.jassub.ready;
		} else {
			await player.__ass.jassub.ready;
			await player.__ass.jassub.renderer.freeTrack();
			await player.__ass.jassub.renderer.setTrackByUrl(track.id);
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
