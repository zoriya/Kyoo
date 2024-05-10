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
import { BaseEpisodeP } from "./episode.base";
import { ShowP } from "./show";
import { WatchStatusP } from "./watch-status";

export const EpisodeP = BaseEpisodeP.and(
	z.object({
		/**
		 * The episode that come before this one if you follow usual watch orders. If this is the first
		 * episode, it will be null.
		 */
		previousEpisode: BaseEpisodeP.nullable().optional(),
		/**
		 * The episode that come after this one if you follow usual watch orders. If this is the last
		 * aired episode, it will be null.
		 */
		nextEpisode: BaseEpisodeP.nullable().optional(),

		show: ShowP.optional(),
		/**
		 * Metadata of what an user as started/planned to watch.
		 */
		watchStatus: WatchStatusP.optional().nullable(),
	}),
).transform((x) => {
	if (x.show && !x.thumbnail && x.show.thumbnail) x.thumbnail = x.show.thumbnail;
	return x;
});

/**
 * A class to represent a single show's episode.
 */
export type Episode = z.infer<typeof EpisodeP>;
