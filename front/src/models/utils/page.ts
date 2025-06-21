import { z } from "zod";

export interface Page<T> {
	this: string;
	first: string;
	next: string | null;
	count: number;
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

export const isPage = <T = unknown>(obj: unknown): obj is Page<T> =>
	(typeof obj === "object" && obj && "items" in obj) || false;
