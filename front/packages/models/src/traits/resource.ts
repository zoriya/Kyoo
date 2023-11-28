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

export const ResourceP = z.object({
	/**
	 * A unique ID for this type of resource. This can't be changed and duplicates are not allowed.
	 */
	id: z.string(),

	/**
	 * A human-readable identifier that can be used instead of an ID. A slug must be unique for a type
	 * of resource but it can be changed.
	 */
	slug: z.string(),
});

/**
 * The base trait used to represent identifiable resources.
 */
export type Resource = z.infer<typeof ResourceP>;
