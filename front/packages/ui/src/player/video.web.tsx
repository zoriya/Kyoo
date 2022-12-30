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

import { Font, Track } from "@kyoo/models";
import {
	forwardRef,
	RefObject,
	useEffect,
	useImperativeHandle,
	useLayoutEffect,
	useRef,
} from "react";
import { VideoProps } from "react-native-video";
import { atom, useAtom, useAtomValue } from "jotai";
import { useYoshiki } from "yoshiki";
import SubtitleOctopus from "libass-wasm";
import { subtitleAtom } from "./state";
import Hls from "hls.js";

declare module "react-native-video" {
	interface VideoProperties {
		fonts?: Font[];
	}
	export type VideoProps = Omit<VideoProperties, "source"> & {
		source: { uri?: string; transmux?: string };
	};
}

enum PlayMode {
	Direct,
	Transmux,
}

const playModeAtom = atom<PlayMode>(PlayMode.Direct);
let hls: Hls | null = null;

const Video = forwardRef<{ seek: (value: number) => void }, VideoProps>(function _Video(
	{ source, paused, muted, volume, onBuffer, onLoad, onProgress, onError, fonts },
	forwaredRef,
) {
	const ref = useRef<HTMLVideoElement>(null);
	const { css } = useYoshiki();

	useImperativeHandle(
		forwaredRef,
		() => ({
			seek: (value: number) => {
				if (ref.current) ref.current.currentTime = value;
			},
		}),
		[],
	);

	useEffect(() => {
		if (paused) ref.current?.pause();
		else ref.current?.play().catch(() => {});
	}, [paused]);
	useEffect(() => {
		if (!ref.current || !volume) return;
		ref.current.volume = Math.max(0, Math.min(volume, 100)) / 100;
	}, [volume]);

	// This should use the selectedTextTrack prop instead of the atom but this is so much simpler
	const subtitle = useAtomValue(subtitleAtom);
	useSubtitle(ref, subtitle, fonts);

	const [playMode, setPlayMode] = useAtom(playModeAtom);
	useEffect(() => {
		setPlayMode(PlayMode.Direct);
	}, [source.uri, setPlayMode]);

	useLayoutEffect(() => {
		console.log("toto");
		const src = playMode === PlayMode.Direct ? source?.uri : source?.transmux;

		if (!ref?.current || !src) return;
		if (playMode == PlayMode.Direct || ref.current.canPlayType("application/vnd.apple.mpegurl")) {
			ref.current.src = src;
		} else {
			if (hls === null) hls = new Hls();
			hls.loadSource(src);
			hls.attachMedia(ref.current);
			hls.on(Hls.Events.MANIFEST_LOADED, async () => {
				try {
					await ref.current?.play();
				} catch {}
			});
		}
	}, [playMode, source?.uri, source?.transmux]);

	return (
		<video
			ref={ref}
			muted={muted}
			autoPlay={!paused}
			onCanPlay={() => onBuffer?.call(null, { isBuffering: false })}
			onWaiting={() => onBuffer?.call(null, { isBuffering: true })}
			onDurationChange={() => {
				if (!ref.current) return;
				onLoad?.call(null, { duration: ref.current.duration } as any);
			}}
			onProgress={() => {
				if (!ref.current) return;
				onProgress?.call(null, {
					currentTime: ref.current.currentTime,
					playableDuration: ref.current.buffered.length
						? ref.current.buffered.end(ref.current.buffered.length - 1)
						: 0,
					seekableDuration: 0,
				});
			}}
			onError={() => {
				if (
					ref?.current?.error?.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED &&
					playMode !== PlayMode.Transmux
				)
					setPlayMode(PlayMode.Transmux);
				else {
					onError?.call(null, {
						error: { "": "", errorString: ref.current?.error?.message ?? "Unknown error" },
					});
				}
			}}
			{...css({ width: "100%", height: "100%" })}
		/>
	);
});

export default Video;

let htmlTrack: HTMLTrackElement | null;
let subOcto: SubtitleOctopus | null;
const useSubtitle = (player: RefObject<HTMLVideoElement>, value: Track | null, fonts?: Font[]) => {
	useEffect(() => {
		if (!player.current) return;

		const removeHtmlSubtitle = () => {
			if (htmlTrack) htmlTrack.remove();
			htmlTrack = null;
		};

		const removeOctoSub = () => {
			if (subOcto) {
				subOcto.freeTrack();
				subOcto.dispose();
			}
			subOcto = null;
		};

		if (!value) {
			removeHtmlSubtitle();
			removeOctoSub();
		} else if (value.codec === "vtt" || value.codec === "subrip") {
			removeOctoSub();
			if (player.current.textTracks.length > 0) player.current.textTracks[0].mode = "hidden";
			const track: HTMLTrackElement = htmlTrack ?? document.createElement("track");
			track.kind = "subtitles";
			track.label = value.displayName;
			if (value.language) track.srclang = value.language;
			track.src = value.link! + ".vtt";
			track.className = "subtitle_container";
			track.default = true;
			track.onload = () => {
				if (player.current) player.current.textTracks[0].mode = "showing";
			};
			if (!htmlTrack) {
				player.current.appendChild(track);
				htmlTrack = track;
			}
		} else if (value.codec === "ass") {
			removeHtmlSubtitle();
			removeOctoSub();
			subOcto = new SubtitleOctopus({
				video: player.current,
				subUrl: value.link!,
				workerUrl: "/_next/static/chunks/subtitles-octopus-worker.js",
				legacyWorkerUrl: "/_next/static/chunks/subtitles-octopus-worker-legacy.js",
				fallbackFont: "/default.woff2",
				fonts: fonts?.map((x) => x.link),
				// availableFonts: fonts ? Object.fromEntries(fonts.map((x) => [x.slug, x.link])) : undefined,
				// lazyFileLoading: true,
				renderMode: "wasm-blend",
			});
		}
	}, [player, value, fonts]);
};
