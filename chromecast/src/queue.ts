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

import { QueueManager } from "chromecast-caf-receiver/cast.framework";
import { LoadRequestData, QueueData, QueueItem } from "chromecast-caf-receiver/cast.framework.messages";
import { getItem, Item, itemToMedia } from "./api";

export class Queue extends cast.framework.QueueBase {
	queue: QueueManager | null;

	constructor() {
		super();
		this.queue = cast.framework.CastReceiverContext.getInstance().getPlayerManager().getQueueManager();
	}

	initialize(requestData: LoadRequestData): QueueData {
		if (requestData.queueData) return requestData.queueData;

		const queueData = new cast.framework.messages.QueueData();
		queueData.name = "queue";
		queueData.items = [requestData.media];
		return queueData;
	}

	async nextItems(itemId?: number): Promise<QueueItem[]> {
		const current = this.queue?.getItems().find(x => x.itemId == itemId);
		if (!current || !current.media?.contentId || !current.media.customData?.serverUrl) return [];

		const metadata = current?.media?.customData as Item;
		const apiUrl = current.media?.customData.serverUrl;
		if (!metadata.nextEpisode) return [];

		const item = await getItem(metadata.nextEpisode.slug, apiUrl);
		if (!item) return [];

		const data = new cast.framework.messages.QueueItem();
		data.media = itemToMedia(item, apiUrl);
		return [data];
	}

	async prevItems(itemId?: number): Promise<QueueItem[]> {
		const current = this.queue?.getItems().find(x => x.itemId == itemId);
		if (!current || !current.media?.contentId || !current.media.customData?.serverUrl) return [];

		const metadata = current?.media?.customData as Item;
		const apiUrl = current.media?.customData.serverUrl;
		if (!metadata.previousEpisode) return [];

		const item = await getItem(metadata.previousEpisode.slug, apiUrl);
		if (!item) return [];

		const data = new cast.framework.messages.QueueItem();
		data.media = itemToMedia(item, apiUrl);
		return [data];
	}
}
