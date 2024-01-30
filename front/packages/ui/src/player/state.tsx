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

import { Episode, Subtitle, useAccount } from "@kyoo/models";
import { atom, useAtom, useAtomValue, useSetAtom } from "jotai";
import { useAtomCallback } from "jotai/utils";
import { ElementRef, memo, useEffect, useLayoutEffect, useRef, useState, useCallback } from "react";
import NativeVideo, { VideoProperties as VideoProps } from "./video";
import { Platform } from "react-native";

export const playAtom = atom(true);
export const loadAtom = atom(false);

// TODO: Default to auto or pristine depending on the user settings.
export enum PlayMode {
	Direct,
	Hls,
}
export const playModeAtom = atom<PlayMode>(PlayMode.Direct);

export const bufferedAtom = atom(0);
export const durationAtom = atom<number | undefined>(undefined);

export const progressAtom = atom(
	(get) => get(privateProgressAtom),
	(get, set, update: number | ((value: number) => number)) => {
		const run = (value: number) => {
			set(privateProgressAtom, value);
			set(publicProgressAtom, value);
		};
		if (typeof update === "function") run(update(get(privateProgressAtom)));
		else run(update);
	},
);
const privateProgressAtom = atom(0);
const publicProgressAtom = atom(0);

export const volumeAtom = atom(100);
export const mutedAtom = atom(false);

export const fullscreenAtom = atom(
	(get) => get(privateFullscreen),
	(get, set, update: boolean | ((value: boolean) => boolean)) => {
		const run = async (value: boolean) => {
			try {
				if (value) {
					await document.body.requestFullscreen({
						navigationUI: "hide",
					});
					set(privateFullscreen, true);
					// @ts-expect-error Firefox does not support this so ts complains
					await screen.orientation.lock("landscape");
				} else {
					if (document.fullscreenElement) await document.exitFullscreen();
					set(privateFullscreen, false);
					screen.orientation.unlock();
				}
			} catch (e) {
				console.error(e);
			}
		};
		if (typeof update === "function") run(update(get(privateFullscreen)));
		else run(update);
	},
);
const privateFullscreen = atom(false);

export const subtitleAtom = atom<Subtitle | null>(null);

export const Video = memo(function Video({
	links,
	subtitles,
	setError,
	fonts,
	startTime: startTimeP,
	...props
}: {
	links?: Episode["links"];
	subtitles?: Subtitle[];
	setError: (error: string | undefined) => void;
	fonts?: string[];
	startTime?: number | null;
} & Partial<VideoProps>) {
	const ref = useRef<ElementRef<typeof NativeVideo> | null>(null);
	const [isPlaying, setPlay] = useAtom(playAtom);
	const setLoad = useSetAtom(loadAtom);
	const [source, setSource] = useState<string | null>(null);
	const [mode, setPlayMode] = useAtom(playModeAtom);

	const startTime = useRef(startTimeP);
	useLayoutEffect(() => {
		startTime.current = startTimeP;
	}, [startTimeP]);

	const publicProgress = useAtomValue(publicProgressAtom);
	const setPrivateProgress = useSetAtom(privateProgressAtom);
	const setPublicProgress = useSetAtom(publicProgressAtom);
	const setBuffered = useSetAtom(bufferedAtom);
	const setDuration = useSetAtom(durationAtom);
	useEffect(() => {
		ref.current?.seek(publicProgress);
	}, [publicProgress]);

	const getProgress = useAtomCallback(useCallback((get) => get(progressAtom), []));
	const oldLinks = useRef(links);
	useLayoutEffect(() => {
		// Reset the state when a new video is loaded.
		setSource((mode === PlayMode.Direct ? links?.direct : links?.hls) ?? null);
		setLoad(true);
		if (oldLinks.current !== links) {
			setPrivateProgress(startTime.current ?? 0);
			setPublicProgress(startTime.current ?? 0);
		} else {
			// keep current time when changing between direct and hls.
			startTime.current = getProgress();
		}
		oldLinks.current = links;
		setPlay(true);
	}, [mode, links, setLoad, setPrivateProgress, setPublicProgress, setPlay, getProgress]);

	const account = useAccount();
	const defaultSubLanguage = account?.settings.subtitleLanguage;
	const setSubtitle = useSetAtom(subtitleAtom);
	useEffect(() => {
		if (!subtitles) return;
		setSubtitle((subtitle) => {
			const subRet = subtitle ? subtitles.find((x) => x.language === subtitle.language) : null;
			if (subRet) return subRet;
			if (!defaultSubLanguage) return null;
			if (defaultSubLanguage == "default") return subtitles.find((x) => x.isDefault) ?? null;
			return subtitles.find((x) => x.language === defaultSubLanguage) ?? null;
		});
		// When the video change, try to persist the subtitle language.
		// Also include the player ref, it can be initalised after the subtitles.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [subtitles, setSubtitle, defaultSubLanguage, ref.current]);

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

	if (!source || !links) return null;
	return (
		<NativeVideo
			ref={ref}
			{...props}
			source={{
				uri: source,
				startPosition: startTime.current ? startTime.current * 1000 : undefined,
				...links,
			}}
			paused={!isPlaying}
			muted={isMuted}
			volume={volume}
			resizeMode="contain"
			onBuffer={({ isBuffering }) => setLoad(isBuffering)}
			onError={(status) => {
				console.error(status);
				setError(status.error.errorString);
			}}
			onProgress={(progress) => {
				setPrivateProgress(progress.currentTime);
				setBuffered(progress.playableDuration);
			}}
			onLoad={(info) => {
				setDuration(info.duration);
			}}
			onPlayPause={setPlay}
			fonts={fonts}
			subtitles={subtitles}
			onMediaUnsupported={() => {
				if (mode == PlayMode.Direct) setPlayMode(PlayMode.Hls);
			}}
		/>
	);
});
