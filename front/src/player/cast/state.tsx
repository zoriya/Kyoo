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
import { useEffect } from "react";
import { bakedAtom } from "~/utils/jotai-utils";
import { stopAtom, localMediaAtom } from "../state";

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
	const { player, controller } = get(playerAtom);
	player.currentTime = value;
	controller.seek();
});

export const [_mediaAtom, mediaAtom] = bakedAtom<Media | null, string>(
	null,
	async (_, _2, value) => {
		const session = cast.framework.CastContext.getInstance().getCurrentSession();
		if (!session) return;
		const mediaInfo = new chrome.cast.media.MediaInfo(
			value, "application/json"
		);
		if (!process.env.NEXT_PUBLIC_BACK_URL) console.error("PUBLIC_BACK_URL is not defined. Chromecast won't work.");
		mediaInfo.customData = { serverUrl: process.env.NEXT_PUBLIC_BACK_URL };
		session.loadMedia(new chrome.cast.media.LoadRequest(mediaInfo));
	},
);

export const useCastController = () => {
	const { player, controller } = useAtomValue(playerAtom);
	const setPlay = useSetAtom(_playAtom);
	const setDuration = useSetAtom(_durationAtom);
	const setMedia = useSetAtom(_mediaAtom);
	const loadMedia = useSetAtom(mediaAtom);
	const stopPlayer = useAtomValue(stopAtom);
	const localMedia = useAtomValue(localMediaAtom);

	useEffect(() => {
		const context = cast.framework.CastContext.getInstance();

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

		const sessionStateHandler = (event: cast.framework.SessionStateEventData) => {
			if (event.sessionState === cast.framework.SessionState.SESSION_STARTED && localMedia) {
				stopPlayer[0]();
				loadMedia(localMedia);
			}
		};

		context.addEventListener(cast.framework.CastContextEventType.SESSION_STATE_CHANGED, sessionStateHandler);
		for (const [key, handler] of eventListeners) controller.addEventListener(key, handler);
		return () => {
			context.removeEventListener(cast.framework.CastContextEventType.SESSION_STATE_CHANGED, sessionStateHandler);
			for (const [key, handler] of eventListeners) controller.removeEventListener(key, handler);
		};
	}, [player, controller, setPlay, setDuration, setMedia, stopPlayer, localMedia, loadMedia]);
};

export const CastController = () => {
	useCastController();
	return null;
};
