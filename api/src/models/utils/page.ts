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

	if (items.length === limit && limit > 0) {
		const uri = new URL(url);
		uri.searchParams.set("after", generateAfter(items[items.length - 1], sort));
		next = uri.toString();
	}
	return { items, this: url, next };
};
