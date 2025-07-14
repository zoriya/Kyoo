import { type ZodType, z } from "zod/v4";

export type Page<T> = {
	this: string;
	next: string | null;
	items: T[];
};

export const Paged = <Parser extends ZodType>(ItemParser: Parser) =>
	z.object({
		this: z.string(),
		next: z.string().nullable(),
		items: z.array(ItemParser),
	});

export const isPage = <T = unknown>(obj: unknown): obj is Page<T> =>
	(typeof obj === "object" && obj && "items" in obj) || false;
