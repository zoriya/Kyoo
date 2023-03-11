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

/**
 * A page of resource that contains information about the pagination of resources.
 */
export interface Page<T> {
	/**
	 * The link of the current page.
	 *
	 * @format uri
	 */
	this: string;

	/**
	 * The link of the first page.
	 *
	 * @format uri
	 */
	first: string;

	/**
	 * The link of the next page.
	 *
	 * @format uri
	 */
	next: string | null;

	/**
	 * The number of items in the current page.
	 */
	count: number;

	/**
	 * The list of items in the page.
	 */
	items: T[];
}

export const Paged = <Item>(item: z.ZodType<Item>): z.ZodSchema<Page<Item>> =>
	z.object({
		this: z.string(),
		first: z.string(),
		next: z.string().nullable(),
		count: z.number(),
		items: z.array(item),
	});
