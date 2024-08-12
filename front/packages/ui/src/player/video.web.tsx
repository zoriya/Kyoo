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

import { type Audio, type Subtitle, getToken } from "@kyoo/models";
import { Menu, tooltip } from "@kyoo/primitives";
import Hls, { type Level, type LoadPolicy } from "hls.js";
import Jassub from "jassub";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import {
	type ComponentProps,
	type RefObject,
	forwardRef,
	useEffect,
	useImperativeHandle,
	useLayoutEffect,
	useRef,
} from "react";
import { useTranslation } from "react-i18next";
import type { VideoProps } from "react-native-video";
import toVttBlob from "srt-webvtt";
import { useForceRerender, useYoshiki } from "yoshiki";
import { useDisplayName } from "../utils";
import { MediaSessionManager } from "./media-session";
import { PlayMode, audioAtom, playAtom, playModeAtom, progressAtom, subtitleAtom } from "./state";

let hls: Hls | null = null;

function uuidv4(): string {
	// @ts-ignore I have no clue how this works, thanks https://stackoverflow.com/questions/105034/how-do-i-create-a-guid-uuid
	return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
		(c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16),
	);
}

const client_id = typeof window === "undefined" ? "ssr" : uuidv4();

const initHls = (): Hls => {
	if (hls) hls.destroy();
	const loadPolicy: LoadPolicy = {
		default: {
			maxTimeToFirstByteMs: Number.POSITIVE_INFINITY,
			maxLoadTimeMs: 60_000,
			timeoutRetry: {
				maxNumRetry: 2,
				retryDelayMs: 0,
				maxRetryDelayMs: 0,
			},
			errorRetry: {
				maxNumRetry: 1,
				retryDelayMs: 0,
				maxRetryDelayMs: 0,
			},
		},
	};
	hls = new Hls({
		xhrSetup: async (xhr) => {
			const token = await getToken();
			if (token) xhr.setRequestHeader("Authorization", token);
			xhr.setRequestHeader("X-CLIENT-ID", client_id);
		},
		autoStartLoad: false,
		startLevel: Number.POSITIVE_INFINITY,
		abrEwmaDefaultEstimate: 35_000_000,
		abrEwmaDefaultEstimateMax: 50_000_000,
		// debug: true,
		lowLatencyMode: false,
		fragLoadPolicy: {
			default: {
				maxTimeToFirstByteMs: Number.POSITIVE_INFINITY,
				maxLoadTimeMs: 60_000,
				timeoutRetry: {
					maxNumRetry: 5,
					retryDelayMs: 100,
					maxRetryDelayMs: 0,
				},
				errorRetry: {
					maxNumRetry: 5,
					retryDelayMs: 0,
					maxRetryDelayMs: 100,
				},
			},
		},
		keyLoadPolicy: loadPolicy,
		certLoadPolicy: loadPolicy,
		playlistLoadPolicy: loadPolicy,
		manifestLoadPolicy: loadPolicy,
		steeringManifestLoadPolicy: loadPolicy,
	});
	return hls;
};

const Video = forwardRef<{ seek: (value: number) => void }, VideoProps>(function Video(
	{
		source,
		paused,
		muted,
		volume,
		onBuffer,
		onLoad,
		onProgress,
		onError,
		onEnd,
		onPlaybackStateChanged,
		onMediaUnsupported,
		fonts,
	},
	forwaredRef,
) {
	const ref = useRef<HTMLVideoElement>(null);
	const oldHls = useRef<string | null>(null);
	const { css } = useYoshiki();
	const errorHandler = useRef<typeof onError>(onError);
	errorHandler.current = onError;

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
		if (!ref.current || paused === ref.current.paused) return;
		if (paused) ref.current?.pause();
		else ref.current?.play().catch(() => {});
	}, [paused]);
	useEffect(() => {
		if (!ref.current || !volume) return;
		ref.current.volume = Math.max(0, Math.min(volume, 100)) / 100;
	}, [volume]);

	const subtitle = useAtomValue(subtitleAtom);
	useSubtitle(ref, subtitle, fonts);

	// biome-ignore lint/correctness/useExhaustiveDependencies: do not restart on startPosition change
	useLayoutEffect(() => {
		if (!ref?.current || !source.uri) return;
		if (!hls || oldHls.current !== source.hls) {
			// Reinit the hls player when we change track.
			hls = initHls();
			hls.loadSource(source.hls!);
			oldHls.current = source.hls;
		}
		if (!source.uri.endsWith(".m3u8")) {
			hls.detachMedia();
			ref.current.src = source.uri;
		} else {
			hls.attachMedia(ref.current);
			hls.startLoad(source.startPosition ? source.startPosition / 1000 : 0);
			hls.on(Hls.Events.ERROR, (_, d) => {
				if (!d.fatal || !hls?.media) return;
				console.warn("Hls error", d);
				errorHandler.current?.({
					error: { errorString: d.reason ?? d.error?.message ?? "Unknown hls error" },
				});
			});
		}
	}, [source.uri, source.hls]);

	useEffect(() => {
		return () => {
			console.log("hls cleanup");
			if (hls) hls.destroy();
			hls = null;
		};
	}, []);

	const mode = useAtomValue(playModeAtom);
	const audio = useAtomValue(audioAtom);
	// biome-ignore lint/correctness/useExhaustiveDependencies: also change when the mode change
	useEffect(() => {
		if (!hls) return;
		const update = () => {
			if (!hls) return;
			hls.audioTrack = audio?.index ?? 0;
		};
		update();
		hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, update);
		return () => hls?.off(Hls.Events.AUDIO_TRACKS_UPDATED, update);
	}, [audio, mode]);

	const setPlay = useSetAtom(playAtom);
	useEffect(() => {
		if (!ref.current) return;
		// Set play state to the player's value (if autoplay is denied)
		setPlay(!ref.current.paused);
	}, [setPlay]);

	const setProgress = useSetAtom(progressAtom);

	return (
		<>
			<MediaSessionManager {...source.metadata} />
			<video
				ref={ref}
				src={source.uri}
				muted={muted}
				autoPlay={!paused}
				controls={false}
				playsInline
				onCanPlay={() => onBuffer?.call(null, { isBuffering: false })}
				onWaiting={() => onBuffer?.call(null, { isBuffering: true })}
				onDurationChange={() => {
					if (!ref.current) return;
					onLoad?.call(null, { duration: ref.current.duration } as any);
				}}
				onTimeUpdate={() => {
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
					if (ref?.current?.error?.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED)
						onMediaUnsupported?.call(undefined);
					else {
						onError?.call(null, {
							error: { errorString: ref.current?.error?.message ?? "Unknown error" },
						});
					}
				}}
				onLoadedMetadata={() => {
					if (source.startPosition) setProgress(source.startPosition / 1000);
				}}
				onPlay={() => onPlaybackStateChanged?.({ isPlaying: true, isSeeking: false })}
				onPause={() => onPlaybackStateChanged?.({ isPlaying: false, isSeeking: false })}
				onEnded={onEnd}
				{...css({ width: "100%", height: "100%", objectFit: "contain" })}
			/>
		</>
	);
});

export default Video;

export const canPlay = (codec: string) => {
	// most chrome based browser (and safari I think) supports matroska but reports they do not.
	// for those browsers, only check the codecs and not the container.
	if (navigator.userAgent.search("Firefox") === -1)
		codec = codec.replace("video/x-matroska", "video/mp4");
	const videos = document.getElementsByTagName("video");
	const video = videos.item(0) ?? document.createElement("video");
	return !!video.canPlayType(codec);
};

const useSubtitle = (
	player: RefObject<HTMLVideoElement>,
	value: Subtitle | null,
	fonts?: string[],
) => {
	const htmlTrack = useRef<HTMLTrackElement | null>();
	const subOcto = useRef<Jassub | null>();
	const mode = useAtom(playModeAtom);

	useEffect(() => {
		if (!player.current) return;

		const removeHtmlSubtitle = () => {
			if (htmlTrack.current) htmlTrack.current.remove();
			htmlTrack.current = null;
		};

		const removeOctoSub = () => {
			if (subOcto.current) subOcto.current.destroy();
			subOcto.current = null;
		};

		if (!value || !value.link) {
			removeHtmlSubtitle();
			removeOctoSub();
		} else if (value.codec === "vtt" || value.codec === "subrip") {
			removeOctoSub();
			if (player.current.textTracks.length > 0) player.current.textTracks[0].mode = "hidden";
			const addSubtitle = async () => {
				const track: HTMLTrackElement = htmlTrack.current ?? document.createElement("track");
				track.kind = "subtitles";
				track.label = value.title ?? value.language ?? "Subtitle";
				if (value.language) track.srclang = value.language;
				track.src = value.codec === "subrip" ? await toWebVtt(value.link!) : value.link!;
				track.className = "subtitle_container";
				track.default = true;
				track.onload = () => {
					if (player.current) player.current.textTracks[0].mode = "showing";
				};
				if (!htmlTrack.current) {
					htmlTrack.current = track;
					if (player.current) player.current.appendChild(track);
				}
			};
			addSubtitle();
		} else if (value.codec === "ass") {
			removeHtmlSubtitle();
			// Also recreate jassub when the player changes (this is not the most effective but
			// since it creates a div/canvas, it needs to be recreated when the UI rerender)
			// @ts-expect-error We are accessing the private _video field here.
			if (!subOcto.current || subOcto.current._video !== player.current) {
				removeOctoSub();
				subOcto.current = new Jassub({
					video: player.current,
					workerUrl: "/_next/static/chunks/jassub-worker.js",
					wasmUrl: "/_next/static/chunks/jassub-worker.wasm",
					legacyWasmUrl: "/_next/static/chunks/jassub-worker.wasm.js",
					// Disable offscreen renderer due to bugs on firefox and chrome android
					// (see https://github.com/ThaUnknown/jassub/issues/31)
					offscreenRender: false,
					subUrl: value.link,
					fonts: fonts,
				});
			} else {
				subOcto.current.freeTrack();
				subOcto.current.setTrackByUrl(value.link);
			}
		}
		// also include mode because srt get's disabled when the mode change (no idea why)
		mode;
	}, [player.current, value, fonts, mode]);
	useEffect(() => {
		return () => {
			if (subOcto.current) subOcto.current.destroy();
			subOcto.current = null;
			if (htmlTrack.current) htmlTrack.current.remove();
			htmlTrack.current = null;
		};
	}, []);
};

const toWebVtt = async (srtUrl: string) => {
	const token = await getToken();
	const query = await fetch(srtUrl, {
		headers: token
			? {
					Authorization: token,
				}
			: undefined,
	});
	const srt = await query.blob();
	return await toVttBlob(srt);
};

export const AudiosMenu = ({
	audios,
	...props
}: ComponentProps<typeof Menu<{ disabled?: boolean }>> & { audios?: Audio[] }) => {
	const { t } = useTranslation();
	const rerender = useForceRerender();
	const [_, setAudio] = useAtom(audioAtom);
	const getDisplayName = useDisplayName();
	// force rerender when mode changes
	useAtomValue(playModeAtom);

	useEffect(() => {
		if (!hls) return;
		hls.on(Hls.Events.AUDIO_TRACK_LOADED, rerender);
		return () => hls?.off(Hls.Events.AUDIO_TRACK_LOADED, rerender);
	});

	if (!hls) return <Menu {...props} disabled {...tooltip(t("player.notInPristine"))} />;
	if (hls.audioTracks.length < 2) return null;

	return (
		<Menu {...props}>
			{hls.audioTracks.map((x, i) => (
				<Menu.Item
					key={i.toString()}
					label={audios ? getDisplayName(audios[i]) : x.name}
					selected={hls!.audioTrack === i}
					onSelect={() => setAudio(audios?.[i] ?? ({ index: i } as any))}
				/>
			))}
		</Menu>
	);
};

export const QualitiesMenu = (props: ComponentProps<typeof Menu>) => {
	const { t } = useTranslation();
	const [mode, setPlayMode] = useAtom(playModeAtom);
	const rerender = useForceRerender();

	// biome-ignore lint/correctness/useExhaustiveDependencies: Inculde hls in dependency array
	useEffect(() => {
		if (!hls) return;
		// Also rerender when hls instance changes
		rerender();
		hls.on(Hls.Events.LEVEL_SWITCHED, rerender);
		return () => hls?.off(Hls.Events.LEVEL_SWITCHED, rerender);
	}, [hls]);

	const levelName = (label: Level, auto?: boolean): string => {
		const height = `${label.height}p`;
		if (auto) return height;
		return label.uri.includes("original") ? `${t("player.transmux")} (${height})` : height;
	};

	return (
		<Menu {...props}>
			<Menu.Item
				label={t("player.direct")}
				selected={hls === null || mode === PlayMode.Direct}
				onSelect={() => setPlayMode(PlayMode.Direct)}
			/>
			<Menu.Item
				label={
					hls?.autoLevelEnabled && hls.currentLevel >= 0
						? `${t("player.auto")} (${levelName(hls.levels[hls.currentLevel], true)})`
						: t("player.auto")
				}
				selected={hls?.autoLevelEnabled && mode === PlayMode.Hls}
				onSelect={() => {
					setPlayMode(PlayMode.Hls);
					if (hls) hls.currentLevel = -1;
				}}
			/>
			{hls?.levels
				.map((x, i) => (
					<Menu.Item
						key={i.toString()}
						label={levelName(x)}
						selected={mode === PlayMode.Hls && hls!.currentLevel === i && !hls?.autoLevelEnabled}
						onSelect={() => {
							setPlayMode(PlayMode.Hls);
							hls!.currentLevel = i;
						}}
					/>
				))
				.reverse()}
		</Menu>
	);
};
