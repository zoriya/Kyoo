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

import { atom, useAtom, useSetAtom } from "jotai";
import { useRouter } from "next/router";
import { ComponentProps, RefObject, useEffect, useRef } from "react";
import { Font, Track } from "~/models/resources/watch-item";
import { bakedAtom } from "~/utils/jotai-utils";
// @ts-ignore
import SubtitleOctopus from "@jellyfin/libass-wasm/dist/js/subtitles-octopus";
import Hls from "hls.js";

enum PlayMode {
	Direct,
	Transmux,
}

const playModeAtom = atom<PlayMode>(PlayMode.Direct);

export const playerAtom = atom<RefObject<HTMLVideoElement> | null>(null);
export const [_playAtom, playAtom] = bakedAtom(true, async (get, set, value) => {
	const player = get(playerAtom);
	if (!player?.current) return;
	if (value) {
		try {
			await player.current.play();
		} catch (e) {
			if (e instanceof DOMException && e.name === "NotSupportedError")
				set(playModeAtom, PlayMode.Transmux);
			else if (!(e instanceof DOMException && e.name === "NotAllowedError")) console.log(e);
		}
	} else {
		player.current.pause();
	}
});
export const loadAtom = atom(false);
export const [_progressAtom, progressAtom] = bakedAtom(0, (get, set, value, baker) => {
	const player = get(playerAtom);
	if (!player?.current) return;
	set(baker, value);
	player.current.currentTime = value;
});
export const bufferedAtom = atom(0);
export const durationAtom = atom(1);
export const [_volumeAtom, volumeAtom] = bakedAtom(100, (get, set, value, baker) => {
	const player = get(playerAtom);
	if (!player?.current) return;
	set(baker, value);
	if (player.current) player.current.volume = Math.max(0, Math.min(value, 100)) / 100;
});
export const [_mutedAtom, mutedAtom] = bakedAtom(false, (get, set, value, baker) => {
	const player = get(playerAtom);
	if (!player?.current) return;
	set(baker, value);
	if (player.current) player.current.muted = value;
});
export const [_, fullscreenAtom] = bakedAtom(false, async (_, set, value, baker) => {
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
});
export const mediaAtom = atom<string | null>(null);
// The tuple is only used to prevent jotai from thinking the function is a read func.
export const stopAtom = atom<[() => void]>([() => {}]);

let hls: Hls | null = null;

export const useVideoController = (slug: string, links?: { direct: string; transmux: string }) => {
	const player = useRef<HTMLVideoElement>(null);
	const setPlayer = useSetAtom(playerAtom);
	const setPlay = useSetAtom(_playAtom);
	const setPPlay = useSetAtom(playAtom);
	const setLoad = useSetAtom(loadAtom);
	const setProgress = useSetAtom(_progressAtom);
	const setBuffered = useSetAtom(bufferedAtom);
	const setDuration = useSetAtom(durationAtom);
	const setVolume = useSetAtom(_volumeAtom);
	const setMuted = useSetAtom(_mutedAtom);
	const setFullscreen = useSetAtom(fullscreenAtom);
	const setMedia = useSetAtom(mediaAtom);
	const [playMode, setPlayMode] = useAtom(playModeAtom);

	setPlayer(player);

	useEffect(() => {
		if (!player.current) return;
		setPlay(!player.current.paused);
	}, [setPlay]);

	useEffect(() => {
		setPlayMode(PlayMode.Direct);
		setMedia(slug);
	}, [slug, links, setPlayMode, setMedia]);

	useEffect(() => {
		const src = playMode === PlayMode.Direct ? links?.direct : links?.transmux;

		if (!player?.current || !src) return;
		if (
			playMode == PlayMode.Direct ||
			player.current.canPlayType("application/vnd.apple.mpegurl")
		) {
			player.current.src = src;
		} else {
			if (hls === null) hls = new Hls();
			hls.loadSource(src);
			hls.attachMedia(player.current);
			hls.on(Hls.Events.MANIFEST_LOADED, async () => {
				try {
					await player.current?.play();
				} catch {}
			});
		}
	}, [playMode, links, player]);

	useEffect(() => {
		if (!player?.current?.duration) return;
		setDuration(player.current.duration);
	}, [player, setDuration]);

	const videoProps: ComponentProps<"video"> = {
		ref: player,
		onDoubleClick: () => {
			setFullscreen(!document.fullscreenElement);
		},
		onPlay: () => setPlay(true),
		onPause: () => setPlay(false),
		onWaiting: () => setLoad(true),
		onCanPlay: () => setLoad(false),
		onError: () => {
			if (player?.current?.error?.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED)
				setPlayMode(PlayMode.Transmux);
		},
		onTimeUpdate: () => setProgress(player?.current?.currentTime ?? 0),
		onDurationChange: () => setDuration(player?.current?.duration ?? 0),
		onProgress: () =>
			setBuffered(
				player?.current?.buffered.length
					? player.current.buffered.end(player.current.buffered.length - 1)
					: 0,
			),
		onVolumeChange: () => {
			if (!player.current) return;
			setVolume(player.current.volume * 100);
			setMuted(player?.current.muted);
		},
		autoPlay: true,
		controls: false,
	};
	return {
		playerRef: player,
		videoProps,
		onVideoClick: () => {
			if (!player.current) return;
			setPPlay(player.current.paused);
		},
	};
};

const htmlTrackAtom = atom<HTMLTrackElement | null>(null);
const suboctoAtom = atom<SubtitleOctopus | null>(null);
export const [_subtitleAtom, subtitleAtom] = bakedAtom<
	Track | null,
	{ track: Track; fonts: Font[] } | null
>(null, (get, set, value, baked) => {
	const removeHtmlSubtitle = () => {
		const htmlTrack = get(htmlTrackAtom);
		if (htmlTrack) htmlTrack.remove();
		set(htmlTrackAtom, null);
	};
	const removeOctoSub = () => {
		const subocto = get(suboctoAtom);
		if (subocto) {
			subocto.freeTrack();
			subocto.dispose();
		}
		set(suboctoAtom, null);
	};

	const player = get(playerAtom);
	if (!player?.current) return;

	if (get(baked)?.id === value?.track.id) return;

	set(baked, value?.track ?? null);
	if (!value) {
		removeHtmlSubtitle();
		removeOctoSub();
	} else if (value.track.codec === "vtt" || value.track.codec === "subrip") {
		removeOctoSub();
		if (player.current.textTracks.length > 0) player.current.textTracks[0].mode = "hidden";
		const track: HTMLTrackElement = get(htmlTrackAtom) ?? document.createElement("track");
		track.kind = "subtitles";
		track.label = value.track.displayName;
		if (value.track.language) track.srclang = value.track.language;
		track.src = value.track.link! + ".vtt";
		track.className = "subtitle_container";
		track.default = true;
		track.onload = () => {
			if (player.current) player.current.textTracks[0].mode = "showing";
		};
		if (!get(htmlTrackAtom)) player.current.appendChild(track);
		set(htmlTrackAtom, track);
	} else if (value.track.codec === "ass") {
		removeHtmlSubtitle();
		removeOctoSub();
		set(
			suboctoAtom,
			new SubtitleOctopus({
				video: player.current,
				subUrl: value.track.link!,
				workerUrl: "/_next/static/chunks/subtitles-octopus-worker.js",
				legacyWorkerUrl: "/_next/static/chunks/subtitles-octopus-worker-legacy.js",
				fonts: value.fonts?.map((x) => x.link),
				renderMode: "wasm-blend",
			}),
		);
	}
});

export const useSubtitleController = (
	player: RefObject<HTMLVideoElement>,
	subtitles?: Track[],
	fonts?: Font[],
) => {
	const {
		query: { subtitle },
	} = useRouter();
	const selectSubtitle = useSetAtom(subtitleAtom);

	const newSub = subtitles?.find((x) => x.language === subtitle);
	useEffect(() => {
		if (newSub === undefined) return;
		selectSubtitle({ track: newSub, fonts: fonts ?? [] });
	}, [player.current?.src, newSub, fonts, selectSubtitle]);
};
