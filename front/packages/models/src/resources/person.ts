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
import { withImages } from "../traits";
import { ResourceP } from "../traits/resource";

export const PersonP = withImages(
	ResourceP.extend({
		/**
		 * The name of this person.
		 */
		name: z.string(),
		/**
		 * The type of work the person has done for the show. That can be something like "Actor",
		 * "Writer", "Music", "Voice Actor"...
		 */
		type: z.string().optional(),

		/**
		 * The role the People played. This is mostly used to inform witch character was played for actor
		 * and voice actors.
		 */
		role: z.string().optional(),
	}),
	"people",
);

/**
 * A studio that make shows.
 */
export type Person = z.infer<typeof PersonP>;
