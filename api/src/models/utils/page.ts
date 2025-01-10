import type { ObjectOptions } from "@sinclair/typebox";
import { t, type TSchema } from "elysia";
import type { Sort } from "./sort";
import { generateAfter } from "./keyset-paginate";

export const Page = <T extends TSchema>(schema: T, options?: ObjectOptions) =>
	t.Object(
		{
			items: t.Array(schema),
			this: t.String({ format: "uri" }),
			next: t.Nullable(t.String({ format: "uri" })),
		},
		options,
	);

export const createPage = <T>(
	items: T[],
	{ url, sort, limit }: { url: string; sort: Sort<any, any>; limit: number },
) => {
	let next: string | null = null;

	// we can't know for sure if there's a next page when the current page is full.
	// maybe the next page is empty, this is a bit weird but it allows us to handle pages
	// without making a new request to the db so it's fine.
	if (items.length === limit && limit > 0) {
		const uri = new URL(url);
		uri.searchParams.set("after", generateAfter(items[items.length - 1], sort));
		next = uri.toString();
	}
	return { items, this: url, next };
};
