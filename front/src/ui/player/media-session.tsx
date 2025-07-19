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

import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useEffect } from "react";
import { useRouter } from "solito/router";
import { reducerAtom } from "./keyboard";
import { durationAtom, playAtom, progressAtom } from "./state";

export const MediaSessionManager = ({
	title,
	subtitle,
	artist,
	imageUri,
	previous,
	next,
}: {
	title?: string;
	subtitle?: string;
	artist?: string;
	imageUri?: string | null;
	previous?: string;
	next?: string;
}) => {
	const [isPlaying, setPlay] = useAtom(playAtom);
	const progress = useAtomValue(progressAtom);
	const duration = useAtomValue(durationAtom);
	const reducer = useSetAtom(reducerAtom);
	const router = useRouter();

	useEffect(() => {
		if (!("mediaSession" in navigator)) return;
		navigator.mediaSession.metadata = new MediaMetadata({
			title: title,
			album: subtitle,
			artist: artist,
			artwork: imageUri ? [{ src: imageUri }] : undefined,
		});
	}, [title, subtitle, artist, imageUri]);

	useEffect(() => {
		if (!("mediaSession" in navigator)) return;
		const actions: [MediaSessionAction, MediaSessionActionHandler | null][] = [
			["play", () => setPlay(true)],
			["pause", () => setPlay(false)],
			["previoustrack", previous ? () => router.push(previous) : null],
			["nexttrack", next ? () => router.push(next) : null],
			[
				"seekbackward",
				(evt: MediaSessionActionDetails) =>
					reducer({ type: "seek", value: evt.seekOffset ? -evt.seekOffset : -10 }),
			],
			[
				"seekforward",
				(evt: MediaSessionActionDetails) =>
					reducer({ type: "seek", value: evt.seekOffset ? evt.seekOffset : 10 }),
			],
			[
				"seekto",
				(evt: MediaSessionActionDetails) => reducer({ type: "seekTo", value: evt.seekTime! }),
			],
		];

		for (const [action, handler] of actions) {
			try {
				navigator.mediaSession.setActionHandler(action, handler);
			} catch {}
		}
	}, [setPlay, reducer, router, previous, next]);

	useEffect(() => {
		if (!("mediaSession" in navigator)) return;
		navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
	}, [isPlaying]);
	useEffect(() => {
		if (!("mediaSession" in navigator) || !duration) return;
		navigator.mediaSession.setPositionState({
			position: Math.min(progress, duration),
			duration,
			playbackRate: 1,
		});
	}, [progress, duration]);

	return null;
};
