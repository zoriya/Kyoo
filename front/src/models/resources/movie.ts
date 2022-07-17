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

import { Resource, Images } from "../traits";

/**
 * A series or a movie.
 */
export interface Movie extends Resource, Images {
	/**
	 * The title of this show.
	 */
	name: string;

	/**
	 * The list of alternative titles of this movie.
	 */
	aliases: string[];

	/**
	 * The summary of this show.
	 */
	overview: string;

	/**
	 * Is this movie aired or planned
	 */
	isPlanned: boolean;

	/**
	 * The date this mavie aired. It can also be null if this is unknown.
	 */
	airDate: Date | null;
}
