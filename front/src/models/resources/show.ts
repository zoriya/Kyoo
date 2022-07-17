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
export interface Show extends Resource, Images {
	/**
	 * The title of this show.
	 */
	name: string;

	/**
	 * The list of alternative titles of this show.
	 */
	aliases: string[];

	/**
	 * The summary of this show.
	 */
	overview: string;

	/**
	 * Is this show airing, not aired yet or finished?
	 */
	status: Status;

	/**
	 * The date this show started airing. It can be null if this is unknown.
	 */
	startAir: Date | null;

	/**
	 * The date this show finished airing. It can also be null if this is unknown.
	 */
	endAir: Date | null;
}

/**
 * The enum containing show's status.
 */
export enum Status {
	Unknown = 0,
	Finished = 1,
	Airing = 2,
	Planned = 3,
}
