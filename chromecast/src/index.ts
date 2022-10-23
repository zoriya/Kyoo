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

import { getItem } from "./api";

const context = cast.framework.CastReceiverContext.getInstance();
const playerManager = context.getPlayerManager();

playerManager.setMessageInterceptor(cast.framework.messages.MessageType.LOAD, async (loadRequestData) => {
	if (loadRequestData.media.contentUrl && loadRequestData.media.metadata) return loadRequestData;

	const item = await getItem(loadRequestData.media.contentId, loadRequestData.media.customData.serverUrl);
	if (!item) {
		return new cast.framework.messages.ErrorData(
			cast.framework.messages.ErrorType.LOAD_FAILED,
		);
	}
	loadRequestData.media.contentUrl = item.link.direct;
	loadRequestData.media.metadata = item;
	return loadRequestData;
});

context.start();
