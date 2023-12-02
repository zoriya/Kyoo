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

import { z } from "zod";
import { zdate } from "../utils"

export enum WatchStatusV {
	Completed = "Completed",
	Watching = "Watching",
	Droped = "Droped",
	Planned = "Planned",
}

export const WatchStatusP = z.object({
	/**
	 * The date this item was added to the watchlist (watched or plan to watch by the user).
	 */
	addedDate: zdate(),
	/**
	 * The date at which this item was played.
	 */
	playedDate: zdate().nullable(),
	/**
	 * Has the user started watching, is it planned?
	 */
	status: z.nativeEnum(WatchStatusV),
	/**
	 * Where the player has stopped watching the episode (in seconds).
	 * Null if the status is not Watching or if the next episode is not started.
	 */
	watchedTime: z.number().int().gte(0).nullable(),
	/**
	 * Where the player has stopped watching the episode (in percentage between 0 and 100).
	 * Null if the status is not Watching or if the next episode is not started.
	 */
	watchedPercent: z.number().int().gte(0).lte(100),
});

export type WatchStatus = z.infer<typeof WatchStatusP>;
