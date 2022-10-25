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

import { getItem, itemToMedia } from "./api";
import { Queue } from "./queue";
const Command = cast.framework.messages.Command;

const context = cast.framework.CastReceiverContext.getInstance();
const playerManager = context.getPlayerManager();

playerManager.setSupportedMediaCommands(
	Command.PAUSE |
		Command.SEEK |
		Command.QUEUE_NEXT |
		Command.QUEUE_PREV |
		Command.EDIT_TRACKS |
		Command.STREAM_MUTE |
		Command.STREAM_VOLUME |
		Command.STREAM_TRANSFER,
);

playerManager.setMessageInterceptor(
	cast.framework.messages.MessageType.LOAD,
	async (loadRequestData) => {
		if (loadRequestData.media.contentUrl && loadRequestData.media.metadata) return loadRequestData;

		const apiUrl = loadRequestData.media.customData.serverUrl;
		const item = await getItem(
			loadRequestData.media.contentId,
			apiUrl,
		);
		if (!item) {
			return new cast.framework.messages.ErrorData(cast.framework.messages.ErrorType.LOAD_FAILED);
		}
		loadRequestData.media = itemToMedia(item, apiUrl);
		return loadRequestData;
	},
);

context.start({ queue: new Queue() });
