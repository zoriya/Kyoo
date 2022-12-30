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
import { atom, useAtom, useAtomValue, useSetAtom } from "jotai";
import { memo, useEffect, useLayoutEffect, useRef } from "react";
import NativeVideo, { VideoProperties as VideoProps } from "./video";
import { bakedAtom } from "../jotai-utils";
import { Platform } from "react-native";

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

const MemoVideo = memo(NativeVideo);

export const Video = memo(function _Video({
	links,
	setError,
	fonts,
	...props
}: {
	links?: WatchItem["link"];
	setError: (error: string | undefined) => void;
} & Partial<VideoProps>) {
	const ref = useRef<NativeVideo | null>(null);
	const [isPlaying, setPlay] = useAtom(playAtom);
	const setLoad = useSetAtom(loadAtom);

	const publicProgress = useAtomValue(publicProgressAtom);
	const setPrivateProgress = useSetAtom(privateProgressAtom);
	const setBuffered = useSetAtom(bufferedAtom);
	const setDuration = useSetAtom(durationAtom);
	useEffect(() => {
		ref.current?.seek(publicProgress);
	}, [publicProgress]);

	useLayoutEffect(() => {
		// Reset the state when a new video is loaded.
		setLoad(true);
		setPrivateProgress(0);
		setPlay(true);
	}, [links, setLoad, setPrivateProgress, setPlay]);

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

	if (!links) return null;
	return (
		<MemoVideo
			ref={ref}
			{...props}
			// @ts-ignore Web only
			source={{ uri: links.direct, transmux: links.transmux }}
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
			onPlayPause={setPlay}
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
		/>
	);
});
