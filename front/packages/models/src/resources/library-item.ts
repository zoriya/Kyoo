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
import { CollectionP } from "./collection";
import { MovieP } from "./movie";
import { ShowP } from "./show";

/**
 * The type of item, ether a show, a movie or a collection.
 */
export enum ItemKind {
	Show = "Show",
	Movie = "Movie",
	Collection = "Collection",
}

export const LibraryItemP = z.union([
	/*
	 * Either a Show
	 */
	ShowP.and(z.object({ kind: z.literal(ItemKind.Show) })),
	/*
	 * Or a Movie
	 */
	MovieP.and(z.object({ kind: z.literal(ItemKind.Movie) })),
	/*
	 * Or a Collection
	 */
	CollectionP.and(z.object({ kind: z.literal(ItemKind.Collection) })),
]);

/**
 * An item that can be contained by a Library (so a Show, a Movie or a Collection).
 */
export type LibraryItem = z.infer<typeof LibraryItemP>;
