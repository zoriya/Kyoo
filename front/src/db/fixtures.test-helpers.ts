import { QueryClient } from "@tanstack/react-query";
import { createDbClient } from "./client";

/** Raw (pre zod) api payloads and a fetch mock for the db tests. */

export const rawEntry = (
	i: number,
	extra: Record<string, unknown> = {},
): Record<string, unknown> => ({
	id: `entry-${i}`,
	slug: `entry-${i}`,
	order: i,
	name: `Entry ${i}`,
	description: null,
	airDate: "2020-01-01",
	runtime: 24,
	thumbnail: null,
	content: "story",
	createdAt: "2020-01-01T00:00:00Z",
	updatedAt: "2020-01-01T00:00:00Z",
	videos: [],
	availableSince: null,
	progress: { percent: 0, time: 0, playedDate: null, videoId: null },
	kind: "episode",
	seasonNumber: 1,
	episodeNumber: i,
	externalId: {},
	...extra,
});

export const rawSerie = (
	id: string,
	extra: Record<string, unknown> = {},
): Record<string, unknown> => ({
	kind: "serie",
	id,
	slug: `slug-${id}`,
	name: `Serie ${id}`,
	original: { name: null, latinName: null, language: "en" },
	tagline: null,
	aliases: [],
	tags: [],
	description: null,
	status: "airing",
	rating: {},
	startAir: "2020-01-01",
	endAir: null,
	genres: ["action"],
	runtime: 24,
	externalId: {},
	poster: null,
	thumbnail: null,
	banner: null,
	logo: null,
	trailerUrl: null,
	entriesCount: 12,
	availableCount: 12,
	createdAt: "2020-01-01T00:00:00Z",
	updatedAt: "2020-01-01T00:00:00Z",
	watchStatus: null,
	...extra,
});

export const page = (items: unknown[], url: string, next: string | null) => ({
	items,
	this: url,
	next,
});

/**
 * Serve `all` ids through kyoo-like keyset pages: `limit` items per page,
 * `after` = last id of the previous page, `next` only when the page is full.
 */
export const pagedRoute = (
	all: () => string[],
	item: (id: string) => unknown,
) => {
	return (url: URL) => {
		const ids = all();
		const limit = Number(url.searchParams.get("limit"));
		const after = url.searchParams.get("after");
		const start = after ? ids.indexOf(after) + 1 : 0;
		const items = ids.slice(start, start + limit);
		let next: string | null = null;
		if (items.length >= limit) {
			const u = new URL(url);
			u.searchParams.set("after", items[items.length - 1]!);
			next = u.toString();
		}
		return page(items.map(item), url.toString(), next);
	};
};

export type Route = (url: URL) => unknown;

/** Replace the global fetch with an in-memory router and record every call. */
export const mockFetch = (routes: Record<string, Route>) => {
	const calls: string[] = [];
	globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
		const url = new URL(typeof input === "string" ? input : input.toString());
		calls.push(`${init?.method ?? "GET"} ${url.pathname}${url.search}`);
		const route = routes[url.pathname];
		if (!route) return new Response("not found", { status: 404 });
		const body = route(url);
		if (body instanceof Error) throw body;
		return new Response(JSON.stringify(body), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	}) as typeof fetch;
	return calls;
};

export const testClient = () =>
	createDbClient({
		apiUrl: "http://api",
		authToken: null,
		lang: "en",
		queryClient: new QueryClient({
			defaultOptions: { queries: { retry: false } },
		}),
	});

export const tick = () => new Promise((r) => setTimeout(r, 0));
