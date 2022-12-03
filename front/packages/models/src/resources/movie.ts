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
import { zdate } from "../utils";
import { ImagesP, ResourceP } from "../traits";
import { GenreP } from "./genre";
import { StudioP } from "./studio";

/**
 * The enum containing movie's status.
 */
export enum MovieStatus {
	Unknown = 0,
	Finished = 1,
	Planned = 3,
}

export const MovieP = z.preprocess(
	(x: any) => {
		// Waiting for the API to be updaded
		x.name = x.title;
		if (x.aliases === null) x.aliases = [];
		x.airDate = x.startAir;
		return x;
	},
	ResourceP.merge(ImagesP).extend({
		/**
		 * The title of this movie.
		 */
		name: z.string(),
		/**
		 * The list of alternative titles of this movie.
		 */
		aliases: z.array(z.string()),
		/**
		 * The summary of this movie.
		 */
		overview: z.string().nullable(),
		/**
		 * Is this movie not aired yet or finished?
		 */
		status: z.nativeEnum(MovieStatus),
		/**
		 * The date this movie aired. It can also be null if this is unknown.
		 */
		airDate: zdate().nullable(),
		/**
		 * The list of genres (themes) this movie has.
		 */
		genres: z.array(GenreP).optional(),
		/**
		 * The studio that made this movie.
		 */
		studio: StudioP.optional().nullable(),
	}),
);

/**
 * A Movie type
 */
export type Movie = z.infer<typeof MovieP>;
