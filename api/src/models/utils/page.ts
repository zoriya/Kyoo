import type { ObjectOptions } from "@sinclair/typebox";
import { type TSchema, t } from "elysia";
import { generateAfter } from "./keyset-paginate";
import type { NonEmptyArray, Sort } from "./sort";

export const Page = <T extends TSchema>(schema: T, options?: ObjectOptions) =>
	t.Object(
		{
			items: t.Array(schema),
			this: t.String({ format: "uri" }),
			next: t.Nullable(t.String({ format: "uri" })),
		},
		{
			description: "Paginated list that match filters.",
			...options,
		},
	);

export const createPage = <
	T,
	const ST extends NonEmptyArray<string>,
	const Remap extends Partial<Record<ST[number], string>> = never,
>(
	items: T[],
	{ url, sort, limit }: { url: string; sort: Sort<ST, Remap>; limit: number },
) => {
	let next: string | null = null;
	const uri = new URL(url);

	if (sort.random) {
		uri.searchParams.set("sort", `random:${sort.random.seed}`);
		url = uri.toString();
	}

	// we can't know for sure if there's a next page when the current page is full.
	// maybe the next page is empty, this is a bit weird but it allows us to handle pages
	// without making a new request to the db so it's fine.
	if (items.length === limit && limit > 0) {
		uri.searchParams.set("after", generateAfter(items[items.length - 1], sort));
		next = uri.toString();
	}
	return { items, this: url, next };
};
