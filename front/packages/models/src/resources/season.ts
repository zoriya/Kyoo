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
import { ImagesP, ResourceP } from "../traits";
import { zdate } from "../utils";

export const SeasonP = ResourceP("season").merge(ImagesP).extend({
	/**
	 * The name of this season.
	 */
	name: z.string(),
	/**
	 * The number of this season. This can be set to 0 to indicate specials.
	 */
	seasonNumber: z.number(),
	/**
	 * A quick overview of this season.
	 */
	overview: z.string().nullable(),
	/**
	 * The starting air date of this season.
	 */
	startDate: zdate().nullable(),
	/**
	 * The ending date of this season.
	 */
	endDate: zdate().nullable(),
	/**
	 * The number of episodes available on kyoo of this season.
	 */
	episodesCount: z.number(),
});

/**
 * A season of a Show.
 */
export type Season = z.infer<typeof SeasonP>;
