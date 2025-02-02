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
