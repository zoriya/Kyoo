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

import { Collection } from "./collection";
import { Movie } from "./movie";
import { Show } from "./show";

/**
 * An item that can be contained by a Library (so a Show, a Movie or a Collection).
 */
export type LibraryItem =
	| (Show & { type: ItemType.Show })
	| (Movie & { type: ItemType.Movie })
	| (Collection & { type: ItemType.Collection });

/**
 * The type of item, ether a show, a movie or a collection.
 */
export enum ItemType {
	Show = 0,
	Movie = 1,
	Collection = 2,
}
