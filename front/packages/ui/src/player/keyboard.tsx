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
import { atom, useSetAtom } from "jotai";
import { useRouter } from "solito/router";
import { useEffect } from "react";
import {
	durationAtom,
	fullscreenAtom,
	mutedAtom,
	playAtom,
	progressAtom,
	subtitleAtom,
	volumeAtom,
} from "./state";

type Action =
	| { type: "play" }
	| { type: "mute" }
	| { type: "fullscreen" }
	| { type: "seek"; value: number }
	| { type: "seekTo"; value: number }
	| { type: "seekPercent"; value: number }
	| { type: "volume"; value: number }
	| { type: "subtitle"; subtitles: Track[]; fonts: Font[] };

export const reducerAtom = atom<null, Action>(null, (get, set, action) => {
	switch (action.type) {
		case "play":
			set(playAtom, !get(playAtom));
			break;
		case "mute":
			set(mutedAtom, !get(mutedAtom));
			break;
		case "fullscreen":
			set(fullscreenAtom, !get(fullscreenAtom));
			break;
		case "seek":
			set(progressAtom, get(progressAtom) + action.value);
			break;
		case "seekTo":
			set(progressAtom, action.value);
			break;
		case "seekPercent":
			set(progressAtom, (get(durationAtom) * action.value) / 100);
			break;
		case "volume":
			set(volumeAtom, get(volumeAtom) + action.value);
			break;
		case "subtitle":
			const subtitle = get(subtitleAtom);
			const index = subtitle ? action.subtitles.findIndex((x) => x.id === subtitle.id) : -1;
			set(
				subtitleAtom,
				index === -1
					? null
					: {
							track: action.subtitles[(index + 1) % action.subtitles.length],
							fonts: action.fonts,
					  },
			);
			break;
	}
});

export const useVideoKeyboard = (
	subtitles?: Track[],
	fonts?: Font[],
	previousEpisode?: string,
	nextEpisode?: string,
) => {
	const reducer = useSetAtom(reducerAtom);
	const router = useRouter();

	useEffect(() => {
		const handler = (event: KeyboardEvent) => {
			if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;

			switch (event.key) {
				case " ":
				case "k":
				case "MediaPlay":
				case "MediaPause":
				case "MediaPlayPause":
					reducer({ type: "play" });
					break;

				case "m":
					reducer({ type: "mute" });
					break;

				case "ArrowLeft":
					reducer({ type: "seek", value: -5 });
					break;
				case "ArrowRight":
					reducer({ type: "seek", value: +5 });
					break;

				case "j":
					reducer({ type: "seek", value: -10 });
					break;
				case "l":
					reducer({ type: "seek", value: +10 });
					break;

				case "ArrowUp":
					reducer({ type: "volume", value: +5 });
					break;
				case "ArrowDown":
					reducer({ type: "volume", value: -5 });
					break;

				case "0":
					reducer({ type: "seekPercent", value: 0 });
					break;
				case "1":
					reducer({ type: "seekPercent", value: 10 });
					break;
				case "2":
					reducer({ type: "seekPercent", value: 20 });
					break;
				case "3":
					reducer({ type: "seekPercent", value: 30 });
					break;
				case "4":
					reducer({ type: "seekPercent", value: 40 });
					break;
				case "5":
					reducer({ type: "seekPercent", value: 50 });
					break;
				case "6":
					reducer({ type: "seekPercent", value: 60 });
					break;
				case "7":
					reducer({ type: "seekPercent", value: 70 });
					break;
				case "8":
					reducer({ type: "seekPercent", value: 80 });
					break;
				case "9":
					reducer({ type: "seekPercent", value: 90 });
					break;

				case "f":
					reducer({ type: "fullscreen" });
					break;

				case "v":
				case "c":
					if (!subtitles || !fonts) return;
					reducer({ type: "subtitle", subtitles, fonts });
					break;

				case "n":
				case "N":
					if (nextEpisode) router.push(nextEpisode);
					break;

				case "p":
				case "P":
					if (previousEpisode) router.push(previousEpisode);
					break;

				default:
					break;
			}
		};

		document.addEventListener("keyup", handler);
		return () => document.removeEventListener("keyup", handler);
	}, [subtitles, fonts, nextEpisode, previousEpisode, router, reducer]);
};
