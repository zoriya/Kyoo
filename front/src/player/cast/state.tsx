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

import { atom, useAtomValue, useSetAtom } from "jotai";
import { useEffect, useMemo } from "react";
import { bakedAtom } from "~/utils/jotai-utils";

export type Media = {
	name: string;
	episodeName?: null;
	episodeNumber?: number;
	seasonNumber?: number;
	absoluteNumber?: string;
	thunbnail?: string;
};

const playerAtom = atom(() => {
	const player = new cast.framework.RemotePlayer();
	return {
		player,
		controller: new cast.framework.RemotePlayerController(player),
	};
});

export const [_playAtom, playAtom] = bakedAtom<boolean, never>(true, (get) => {
	const { controller } = get(playerAtom);
	controller.playOrPause();
});
export const [_durationAtom, durationAtom] = bakedAtom(1, (get, _, value) => {
	const { controller } = get(playerAtom);
	controller.seek();
});

export const [_mediaAtom, mediaAtom] = bakedAtom<Media | null, string>(null, (get, _, value) => {});

export const useCastController = () => {
	const { player, controller } = useAtomValue(playerAtom);
	const setPlay = useSetAtom(_playAtom);
	const setDuration = useSetAtom(_durationAtom);
	const setMedia = useSetAtom(_mediaAtom);

	useEffect(() => {
		const eventListeners: [
			cast.framework.RemotePlayerEventType,
			(event: cast.framework.RemotePlayerChangedEvent<any>) => void,
		][] = [
			[cast.framework.RemotePlayerEventType.IS_PAUSED_CHANGED, (event) => setPlay(event.value)],
			[cast.framework.RemotePlayerEventType.DURATION_CHANGED, (event) => setDuration(event.value)],
			[
				cast.framework.RemotePlayerEventType.MEDIA_INFO_CHANGED,
				() => setMedia(player.mediaInfo?.metadata),
			],
		];

		for (const [key, handler] of eventListeners) controller.addEventListener(key, handler);
		return () => {
			for (const [key, handler] of eventListeners) controller.removeEventListener(key, handler);
		};
	}, [player, controller, setPlay, setDuration, setMedia]);
};
