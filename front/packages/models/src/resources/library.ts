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
import { ResourceP } from "../traits/resource";

/**
 * The library that will contain Shows, Collections...
 */
export const LibraryP = ResourceP.extend({
	/**
	 * The name of this library.
	 */
	name: z.string(),

	/**
	 * The list of paths that this library is responsible for. This is mainly used by the Scan task.
	 */
	paths: z.array(z.string()),
});

export type Library = z.infer<typeof LibraryP>;
