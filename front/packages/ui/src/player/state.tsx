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

import { Font, Track, WatchItem } from "@kyoo/models";
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
	fonts,
	...props
}: {
	links?: WatchItem["link"];
	setError: (error: string | undefined) => void;
} & VideoProps) => {
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
			fonts={fonts}
			// TODO: textTracks: external subtitles
			// onError: () => {
			// 	if (player?.current?.error?.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED)
			// 		setPlayMode(PlayMode.Transmux);
			// },
		/>
	);
};
