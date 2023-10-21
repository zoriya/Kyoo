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
import { SeasonP } from "./season";
import { StudioP } from "./studio";

/**
 * The enum containing show's status.
 */
export enum Status {
	Unknown = "Unknown",
	Finished = "Finished",
	Airing = "Airing",
	Planned = "Planned",
}

export const ShowP = ResourceP.merge(ImagesP)
	.extend({
		/**
		 * The title of this show.
		 */
		name: z.string(),
		/**
		 * A catchphrase for this show.
		 */
		tagline: z.string().nullable(),
		/**
		 * The list of alternative titles of this show.
		 */
		aliases: z.array(z.string()),
		/**
		 * The summary of this show.
		 */
		overview: z.string().nullable(),
		/**
		 * A list of tags that match this movie.
		 */
		tags: z.array(z.string()),
		/**
		 * Is this show airing, not aired yet or finished?
		 */
		status: z.nativeEnum(Status),
		/**
		 * The date this show started airing. It can be null if this is unknown.
		 */
		startAir: zdate().nullable(),
		/**
		 * The date this show finished airing. It can also be null if this is unknown.
		 */
		endAir: zdate().nullable(),
		/**
		 * The list of genres (themes) this show has.
		 */
		genres: z.array(z.nativeEnum(Genre)),
		/**
		 * A youtube url for the trailer.
		 */
		trailer: z.string().optional().nullable(),
		/**
		 * The studio that made this show.
		 */
		studio: StudioP.optional().nullable(),
		/**
		 * The list of seasons of this show.
		 */
		seasons: z.array(SeasonP).optional(),
	})
	.transform((x) => {
		if (!x.thumbnail && x.poster) {
			x.thumbnail = { ...x.poster };
			if (x.thumbnail) {
				x.thumbnail.low = x.thumbnail.high;
				x.thumbnail.medium = x.thumbnail.high;
			}
		}
		return x;
	})
	.transform((x) => ({
		href: `/show/${x.slug}`,
		playHref: `/watch/${x.slug}-s1e1`,
		...x,
	}));

/**
 * A tv serie or an anime.
 */
export type Show = z.infer<typeof ShowP>;
