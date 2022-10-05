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
import { zdate } from "~/utils/zod";
import { ImagesP } from "../traits";
import { ResourceP } from "../traits/resource";

export const EpisodeP = z.preprocess(
	(x: any) => {
		if (!x) return x;
		x.name = x.title;
		return x;
	},
	ResourceP.merge(ImagesP).extend({
		/**
		 * The season in witch this episode is in.
		 */
		seasonNumber: z.number().nullable(),

		/**
		 * The number of this episode in it's season.
		 */
		episodeNumber: z.number().nullable(),

		/**
		 * The absolute number of this episode. It's an episode number that is not reset to 1 after a new season.
		 */
		absoluteNumber: z.number().nullable(),

		/**
		 * The title of this episode.
		 */
		name: z.string().nullable(),

		/**
		 * The overview of this episode.
		 */
		overview: z.string().nullable(),

		/**
		 * The release date of this episode. It can be null if unknown.
		 */
		releaseDate: zdate().nullable(),
	}),
);

/**
 * A class to represent a single show's episode.
 */
export type Episode = z.infer<typeof EpisodeP>;
