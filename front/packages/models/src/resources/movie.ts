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
import { ImagesP, ResourceP, imageFn } from "../traits";
import { zdate } from "../utils";
import { CollectionP } from "./collection";
import { Genre } from "./genre";
import { MetadataP } from "./metadata";
import { Status } from "./show";
import { StudioP } from "./studio";
import { WatchStatusP } from "./watch-status";

export const MovieP = ResourceP("movie")
	.merge(ImagesP)
	.extend({
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
		 * /** Is this movie not aired yet or finished?
		 */
		status: z.nativeEnum(Status),
		/**
		 * How well this item is rated? (from 0 to 100).
		 */
		rating: z.number().int().gte(0).lte(100),
		/**
		 * How long is this movie? (in minutes).
		 */
		runtime: z.number().int().nullable(),
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
		/**
		 * The collection this movie is part of.
		 */
		collections: z.array(CollectionP).optional(),
		/**
		 * The links to see a movie or an episode.
		 */
		links: z.object({
			/**
			 * The direct link to the unprocessed video (pristine quality).
			 */
			direct: z.string().transform(imageFn),

			/**
			 * The link to an HLS master playlist containing all qualities available for this video.
			 */
			hls: z.string().transform(imageFn).nullable(),
		}),
		/**
		 * The link to metadata providers that this show has.
		 */
		externalId: MetadataP,
		/**
		 * Metadata of what an user as started/planned to watch.
		 */
		watchStatus: WatchStatusP.optional().nullable(),
	})
	.transform((x) => ({
		...x,
		runtime: x.runtime === 0 ? null : x.runtime,
	}))
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
		...x,
		href: `/movie/${x.slug}`,
		playHref: `/movie/${x.slug}/watch`,
	}));

/**
 * A Movie type
 */
export type Movie = z.infer<typeof MovieP>;
