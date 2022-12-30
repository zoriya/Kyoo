/*
 * Kyoo - A portable and vast media library solution.
 * Copyright (c) Kyoo.
 *
 * See AUTHORS.md and LICENSE file in the project root for full license information.
 *
 * Kyoo is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * any later version.
 *
 * Kyoo is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Kyoo. If not, see <https://www.gnu.org/licenses/>.
 */

import { Track, WatchItem } from "@kyoo/models";
import { atom, useAtomValue, useSetAtom } from "jotai";
import { useEffect, useLayoutEffect, useRef } from "react";
import NativeVideo, { VideoProperties as VideoProps } from "./video";
import { bakedAtom } from "../jotai-utils";
import { Platform } from "react-native";

enum PlayMode {
	Direct,
	Transmux,
}

const playModeAtom = atom<PlayMode>(PlayMode.Direct);

export const playAtom = atom(true);
export const loadAtom = atom(false);

export const bufferedAtom = atom(0);
export const durationAtom = atom<number | undefined>(undefined);

export const progressAtom = atom<number, number>(
	(get) => get(privateProgressAtom),
	(_, set, value) => {
		set(privateProgressAtom, value);
		set(publicProgressAtom, value);
	},
);
const privateProgressAtom = atom(0);
const publicProgressAtom = atom(0);

export const volumeAtom = atom(100);
export const mutedAtom = atom(false);

export const [privateFullscreen, fullscreenAtom] = bakedAtom(
	false,
	async (_, set, value, baker) => {
		try {
			if (value) {
				await document.body.requestFullscreen();
				set(baker, true);
				await screen.orientation.lock("landscape");
			} else {
				await document.exitFullscreen();
				set(baker, false);
				screen.orientation.unlock();
			}
		} catch {}
	},
);

export const subtitleAtom = atom<Track | null>(null);

export const Video = ({
	links,
	setError,
	...props
}: { links?: WatchItem["link"]; setError: (error: string | undefined) => void } & VideoProps) => {
	const ref = useRef<NativeVideo | null>(null);
	const isPlaying = useAtomValue(playAtom);
	const setLoad = useSetAtom(loadAtom);

	useLayoutEffect(() => {
		setLoad(true);
	}, [setLoad]);

	const publicProgress = useAtomValue(publicProgressAtom);
	const setPrivateProgress = useSetAtom(privateProgressAtom);
	const setBuffered = useSetAtom(bufferedAtom);
	const setDuration = useSetAtom(durationAtom);
	useEffect(() => {
		ref.current?.seek(publicProgress);
	}, [publicProgress]);

	const volume = useAtomValue(volumeAtom);
	const isMuted = useAtomValue(mutedAtom);

	const setFullscreen = useSetAtom(privateFullscreen);
	useEffect(() => {
		if (Platform.OS !== "web") return;
		const handler = () => {
			setFullscreen(document.fullscreenElement != null);
		};
		document.addEventListener("fullscreenchange", handler);
		return () => document.removeEventListener("fullscreenchange", handler);
	});

	const subtitle = useAtomValue(subtitleAtom);

	// useEffect(() => {
	// 	setPlayMode(PlayMode.Direct);
	// }, [links, setPlayMode]);

	// useEffect(() => {
	// 	const src = playMode === PlayMode.Direct ? links?.direct : links?.transmux;

	// 	if (!player?.current || !src) return;
	// 	if (
	// 		playMode == PlayMode.Direct ||
	// 		player.current.canPlayType("application/vnd.apple.mpegurl")
	// 	) {
	// 		player.current.src = src;
	// 	} else {
	// 		if (hls === null) hls = new Hls();
	// 		hls.loadSource(src);
	// 		hls.attachMedia(player.current);
	// 		hls.on(Hls.Events.MANIFEST_LOADED, async () => {
	// 			try {
	// 				await player.current?.play();
	// 			} catch {}
	// 		});
	// 	}
	// }, [playMode, links, player]);

	if (!links) return null;
	return (
		<NativeVideo
			ref={ref}
			{...props}
			source={{ uri: links.direct }}
			paused={!isPlaying}
			muted={isMuted}
			volume={volume}
			resizeMode="contain"
			onBuffer={({ isBuffering }) => setLoad(isBuffering)}
			onError={(status) => setError(status.error.errorString)}
			onProgress={(progress) => {
				setPrivateProgress(progress.currentTime);
				setBuffered(progress.playableDuration);
			}}
			onLoad={(info) => {
				setDuration(info.duration);
			}}
			selectedTextTrack={
				subtitle
					? {
							type: "index",
							value: subtitle.trackIndex,
					  }
					: { type: "disabled" }
			}
			// TODO: textTracks: external subtitles
			// onError: () => {
			// 	if (player?.current?.error?.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED)
			// 		setPlayMode(PlayMode.Transmux);
			// },
		/>
	);
};

// const htmlTrackAtom = atom<HTMLTrackElement | null>(null);
// const suboctoAtom = atom<SubtitleOctopus | null>(null);
// export const [_subtitleAtom, subtitleAtom] = bakedAtom<
// 	Track | null,
// 	{ track: Track; fonts: Font[] } | null
// >(null, (get, set, value, baked) => {
// 	const removeHtmlSubtitle = () => {
// 		const htmlTrack = get(htmlTrackAtom);
// 		if (htmlTrack) htmlTrack.remove();
// 		set(htmlTrackAtom, null);
// 	};
// 	const removeOctoSub = () => {
// 		const subocto = get(suboctoAtom);
// 		if (subocto) {
// 			subocto.freeTrack();
// 			subocto.dispose();
// 		}
// 		set(suboctoAtom, null);
// 	};

// 	const player = get(playerAtom);
// 	if (!player?.current) return;

// 	if (get(baked)?.id === value?.track.id) return;

// 	set(baked, value?.track ?? null);
// 	if (!value) {
// 		removeHtmlSubtitle();
// 		removeOctoSub();
// 	} else if (value.track.codec === "vtt" || value.track.codec === "subrip") {
// 		removeOctoSub();
// 		if (player.current.textTracks.length > 0) player.current.textTracks[0].mode = "hidden";
// 		const track: HTMLTrackElement = get(htmlTrackAtom) ?? document.createElement("track");
// 		track.kind = "subtitles";
// 		track.label = value.track.displayName;
// 		if (value.track.language) track.srclang = value.track.language;
// 		track.src = value.track.link! + ".vtt";
// 		track.className = "subtitle_container";
// 		track.default = true;
// 		track.onload = () => {
// 			if (player.current) player.current.textTracks[0].mode = "showing";
// 		};
// 		if (!get(htmlTrackAtom)) player.current.appendChild(track);
// 		set(htmlTrackAtom, track);
// 	} else if (value.track.codec === "ass") {
// 		removeHtmlSubtitle();
// 		removeOctoSub();
// 		set(
// 			suboctoAtom,
// 			new SubtitleOctopus({
// 				video: player.current,
// 				subUrl: value.track.link!,
// 				workerUrl: "/_next/static/chunks/subtitles-octopus-worker.js",
// 				legacyWorkerUrl: "/_next/static/chunks/subtitles-octopus-worker-legacy.js",
// 				fonts: value.fonts?.map((x) => x.link),
// 				renderMode: "wasm-blend",
// 			}),
// 		);
// 	}
// });

// const { useParam } = createParam<{ subtitle: string }>();

// export const useSubtitleController = (
// 	player: RefObject<HTMLVideoElement>,
// 	subtitles?: Track[],
// 	fonts?: Font[],
// ) => {
// 	const [subtitle] = useParam("subtitle");
// 	const selectSubtitle = useSetAtom(subtitleAtom);

// 	const newSub = subtitles?.find((x) => x.language === subtitle);
// 	useEffect(() => {
// 		if (newSub === undefined) return;
// 		selectSubtitle({ track: newSub, fonts: fonts ?? [] });
// 	}, [player.current?.src, newSub, fonts, selectSubtitle]);
// };
