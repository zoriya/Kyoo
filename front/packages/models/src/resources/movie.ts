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
import { Genre } from "./genre";
import { StudioP } from "./studio";
import { Status } from "./show";

export const MovieP = ResourceP.merge(ImagesP).extend({
	/**
	 * The title of this movie.
	 */
	name: z.string(),
	/**
	 * A catchphrase for this show.
	 */
	tagline: z.string().nullable(),
	/**
	 * The list of alternative titles of this movie.
	 */
	aliases: z.array(z.string()),
	/**
	 * The summary of this movie.
	 */
	overview: z.string().nullable(),
	/**
	 * A list of tags that match this movie.
	 */
	tags: z.array(z.string()),
	/**
	/**
	 * Is this movie not aired yet or finished?
	 */
	status: z.nativeEnum(Status),
	/**
	 * The date this movie aired. It can also be null if this is unknown.
	 */
	airDate: zdate().nullable(),
	/**
	 * A youtube url for the trailer.
	 */
	trailer: z.string().optional().nullable(),
	/**
	 * The list of genres (themes) this movie has.
	 */
	genres: z.array(z.nativeEnum(Genre)),
	/**
	 * The studio that made this movie.
	 */
	studio: StudioP.optional().nullable(),
});

/**
 * A Movie type
 */
export type Movie = z.infer<typeof MovieP>;
