import type { ObjectOptions } from "@sinclair/typebox";
import { t, type TSchema } from "elysia";
import type { Sort } from "./sort";
import { generateAfter, isReverse } from "./keyset-paginate";

export const Page = <T extends TSchema>(schema: T, options?: ObjectOptions) =>
	t.Object(
		{
			items: t.Array(schema),
			this: t.String({ format: "uri" }),
			prev: t.Nullable(t.String({ format: "uri" })),
			next: t.Nullable(t.String({ format: "uri" })),
		},
		options,
	);

export const createPage = <T>(
	items: T[],
	{ url, sort, limit }: { url: string; sort: Sort<any, any>; limit: number },
) => {
	let prev: string | null = null;
	let next: string | null = null;

	const uri = new URL(url);
	const after = uri.searchParams.get("after");
	const reverse = after && isReverse(after) ? 1 : 0;

	const has = [
		// prev
		items.length > 0 && after,
		// next
		items.length === limit && limit > 0,
	];

	if (has[0 + reverse]) {
		uri.searchParams.set("after", generateAfter(items[0], sort, true));
		prev = uri.toString();
	}
	if (has[1 - reverse]) {
		uri.searchParams.set("after", generateAfter(items[items.length - 1], sort));
		next = uri.toString();
	}
	return { items, this: url, prev, next };
};
