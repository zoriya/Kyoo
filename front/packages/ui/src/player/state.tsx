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

import { Track, WatchItem, Font } from "@kyoo/models";
import { atom, useAtom, useAtomValue, useSetAtom } from "jotai";
import { memo, useEffect, useLayoutEffect, useRef, useState } from "react";
import NativeVideo, { VideoProperties as VideoProps } from "./video";
import { Platform } from "react-native";

export const playAtom = atom(true);
export const loadAtom = atom(false);
// TODO: Default to auto or pristine depending on the user settings.
export const qualityAtom = atom<string>("Pristine");

export const bufferedAtom = atom(0);
export const durationAtom = atom<number | undefined>(undefined);

export const progressAtom = atom(
	(get) => get(privateProgressAtom),
	(_, set, value: number) => {
		set(privateProgressAtom, value);
		set(publicProgressAtom, value);
	},
);
const privateProgressAtom = atom(0);
const publicProgressAtom = atom(0);

export const volumeAtom = atom(100);
export const mutedAtom = atom(false);

export const fullscreenAtom = atom(
	(get) => get(privateFullscreen),
	async (_, set, value: boolean) => {
		try {
			if (value) {
				await document.body.requestFullscreen();
				set(privateFullscreen, true);
				await screen.orientation.lock("landscape");
			} else {
				await document.exitFullscreen();
				set(privateFullscreen, false);
				screen.orientation.unlock();
			}
		} catch {}
	},
);
const privateFullscreen = atom(false);

export const subtitleAtom = atom<Track | null>(null);

export const Video = memo(function _Video({
	links,
	setError,
	fonts,
	...props
}: {
	links?: WatchItem["link"];
	setError: (error: string | undefined) => void;
	fonts?: Font[];
} & Partial<VideoProps>) {
	const ref = useRef<NativeVideo | null>(null);
	const [isPlaying, setPlay] = useAtom(playAtom);
	const setLoad = useSetAtom(loadAtom);
	const [source, setSource] = useState<WatchItem["link"][0] | null>(null);
	const [quality, setQuality] = useAtom(qualityAtom);

	const publicProgress = useAtomValue(publicProgressAtom);
	const setPrivateProgress = useSetAtom(privateProgressAtom);
	const setBuffered = useSetAtom(bufferedAtom);
	const setDuration = useSetAtom(durationAtom);
	useEffect(() => {
		ref.current?.seek(publicProgress);
	}, [publicProgress]);

	useLayoutEffect(() => {
		// Reset the state when a new video is loaded.
		setSource(links?.find(x => x.name == quality) ?? null)
		setLoad(true);
		setPrivateProgress(0);
		setPlay(true);
	}, [quality, links, setLoad, setPrivateProgress, setPlay]);

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

	if (!source) return null;
	return (
		<NativeVideo
			ref={ref}
			{...props}
			source={{ uri: source.link, ...source }}
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
			onMediaUnsupported={() => {
				if (source.type === "direct")
					setQuality(links?.find(x => x.type == "transmux")!.name!)

				// TODO: Replace transcode with transcode-auto when supported.
				if (source.type === "transmux")
					setQuality(links?.find(x => x.type == "transcode")!.name!)

			}}

			// TODO: textTracks: external subtitles
		/>
	);
});
