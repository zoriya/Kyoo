import type { ObjectOptions } from "@sinclair/typebox";
import { type TSchema, t } from "elysia";
import { buildUrl } from "~/utils";
import { generateAfter } from "./keyset-paginate";
import type { Sort } from "./sort";

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

export const createPage = <T>(
	items: T[],
	{
		url,
		sort,
		limit,
		headers,
	}: {
		url: string;
		sort: Sort;
		limit: number;
		headers?: Record<string, string | undefined>;
	},
) => {
	const uri = new URL(url);
	const forwardedProto = headers?.["x-forwarded-proto"];
	if (forwardedProto) {
		uri.protocol = forwardedProto;
	}
	const forwardedHost = headers?.["x-forwarded-host"];
	if (forwardedHost) {
		uri.host = forwardedHost;
	}

	const current = uri.toString();

	let next: string | null = null;
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
	return { items, this: current, next };
};
