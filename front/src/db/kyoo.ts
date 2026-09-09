import {
	BTreeIndex,
	type ChangeMessageOrDeleteKeyMessage,
	type Collection,
	type CollectionConfig,
	collectionOptions,
	type Context,
	type DbClient,
	type IR,
	type LoadSubsetOptions,
	type PendingMutation,
	type QueryBuilder,
	type SyncConfig,
} from "@tanstack/react-db";
import type { z } from "zod/v4";
import { Paged } from "~/models";
import { keyToUrl, queryFn, toQueryKey } from "~/query/api";
import { getDeps } from "./client";
import { type FieldMap, serializeOrderBy, serializeWhere } from "./odata";
import { withPersistence } from "./persistence";

/**
 * `kyooCollection` turns a description of one kyoo resource into a TanStack
 * DB collection that:
 *
 * - is filled lazily: a live query's `where`/`orderBy` is translated into the
 *   right route + `filter`/`sort`/`query` params (see `odata.ts`), and its
 *   window (`limit`/`offset`) into keyset pagination by following the api's
 *   `next` urls;
 * - normalizes payloads (`normalize`) so every entity has one local row;
 * - forwards optimistic mutations to the api (`onUpdate`/`onDelete`);
 * - is persisted in sqlite on native.
 */

type Params = Record<string, boolean | number | string | string[] | undefined>;

/**
 * Live query refs distribute over unions: `s.startAir` only typechecks if every
 * member has it. `Complete` adds the missing keys of a discriminated union as
 * `?: undefined` so rows of several kinds can share one collection.
 */
type Keys<U> = U extends unknown ? keyof U : never;
export type Complete<U, K extends PropertyKey = Keys<U>> = U extends unknown
	? U & { [P in Exclude<K, keyof U>]?: undefined }
	: never;

/**
 * Give a query a hand written result type: spreading a union row in `select`
 * collapses it into one object, which loses the `kind` narrowing screens use.
 */
export type Retyped<T, Single extends boolean> = Omit<
	Context,
	"result" | "hasResult" | "singleResult"
> & {
	result: T;
	hasResult: true;
	singleResult: Single;
};
export const retype = <T, Single extends boolean = false>(
	q: QueryBuilder<any>,
) => q as unknown as QueryBuilder<Retyped<T, Single>>;

export type Bind = {
	/** Row field(s) whose `eq` predicate binds the param (first one found). */
	field: string | string[];
	/** Turn the predicate value into the url segment. */
	map?: (value: string) => string;
	/** Write the bound value on fetched rows missing the field (default true). */
	stamp?: boolean;
};

export type Route = {
	/** `/api/series/:show/entries`: `:param`s are bound from `eq` predicates. */
	path: string;
	bind?: Record<string, string | string[] | Bind>;
	/** Extra condition, e.g. a route dedicated to a sort order. */
	when?: (ctx: { sort: string[] }) => boolean;
	/** Extra query params (relations to include...). */
	params?: (bound: Record<string, string>) => Params;
	/** The route returns one item instead of a page. */
	single?: boolean;
	/** The route has a fixed order, don't send `sort`. */
	sortable?: boolean;
};

export type NormalizeContext<TRow> = {
	client: DbClient;
	/** Row currently stored for this key, if any. */
	existing: (key: string) => TRow | undefined;
	/** Route params the payload was fetched with. */
	bound: Record<string, string>;
};

export type Api = <T = unknown>(
	method: "POST" | "PUT" | "PATCH" | "DELETE",
	path: string[],
	body?: object,
) => Promise<T>;

export type MutationContext<TRow extends object> = {
	mutations: PendingMutation<TRow>[];
	api: Api;
	client: DbClient;
	utils: KyooUtils<TRow>;
};

export type KyooCollectionConfig<TItem, TRow extends object> = {
	id: string;
	/** Parser of one api item. */
	item: z.ZodType<TItem>;
	getKey: (row: TRow) => string;
	/** Server filter/sort keys of this resource. */
	fields: FieldMap;
	/** Most specific first. */
	routes: Route[];
	/** Api item -> local row. Nested relations go to their own collection here. */
	normalize: (item: TItem, ctx: NormalizeContext<TRow>) => TRow;
	/** Fields live queries sort by. */
	indexes?: ((row: TRow) => unknown)[];
	onUpdate?: (ctx: MutationContext<TRow>) => Promise<void>;
	onDelete?: (ctx: MutationContext<TRow>) => Promise<void>;
};

/** Direct access to the synced state, bypassing optimistic mutations. */
export type Writer<TRow> = {
	/** Merge rows in: `undefined` fields never erase existing values. */
	upsert: (rows: Partial<TRow>[]) => void;
	remove: (keys: string[]) => void;
	get: (key: string) => TRow | undefined;
};

export type KyooUtils<TRow extends object> = {
	writer: () => Writer<TRow>;
	/** Re-fetch one row through the detail route (after a mutation, an event). */
	reload: (row: TRow) => Promise<void>;
	/** Re-fetch the first page of every request made so far. */
	refetch: () => Promise<void>;
};

const mergeDefined = <T extends object>(base: T, patch: Partial<T>): T => {
	const ret = { ...base } as Record<string, unknown>;
	for (const [k, v] of Object.entries(patch)) if (v !== undefined) ret[k] = v;
	return ret as T;
};

const createWriter = <TRow extends object>(params: {
	collection: Collection<TRow, string, any, any, any>;
	begin: (options?: { immediate?: boolean }) => void;
	write: (message: ChangeMessageOrDeleteKeyMessage<TRow, string>) => void;
	commit: () => unknown;
}): Writer<TRow> => {
	const synced = () => params.collection._state.syncedData;
	let depth = 0;
	const batch = (fn: () => void) => {
		if (depth === 0) params.begin({ immediate: true });
		depth++;
		try {
			fn();
		} finally {
			depth--;
			if (depth === 0) params.commit();
		}
	};
	return {
		get: (key) => synced().get(key),
		upsert: (rows) =>
			batch(() => {
				for (const row of rows) {
					const key = params.collection.getKeyFromItem(row as TRow);
					const existing = synced().get(key);
					params.write({
						type: existing ? "update" : "insert",
						value: existing ? mergeDefined(existing, row) : (row as TRow),
					});
				}
			}),
		remove: (keys) =>
			batch(() => {
				for (const key of keys)
					if (synced().has(key)) params.write({ type: "delete", key });
			}),
	};
};

/** Every `field = value` / `field in (...)` a where mentions, regardless of nesting. */
const lookupsOf = (where: IR.BasicExpression | undefined) => {
	const out = new Map<string, unknown[]>();
	const visit = (e: IR.BasicExpression | undefined) => {
		if (!e || e.type !== "func") return;
		if (e.name === "and" || e.name === "or" || e.name === "not") {
			for (const arg of e.args) visit(arg);
			return;
		}
		if (e.name !== "eq" && e.name !== "in") return;
		const [a, b] = e.args;
		const ref = a?.type === "ref" ? a : b?.type === "ref" ? b : undefined;
		const val = a?.type === "val" ? a : b?.type === "val" ? b : undefined;
		if (!ref || !val) return;
		// live query refs are [alias, ...path]
		const field = ref.path.slice(ref.path.length > 1 ? 1 : 0).join(".");
		const values = Array.isArray(val.value) ? val.value : [val.value];
		out.set(field, [...(out.get(field) ?? []), ...values]);
	};
	visit(where);
	return out;
};

/** Remove the predicates a route consumed (they became url segments). */
const without = (
	where: IR.BasicExpression<boolean> | undefined,
	consumed: Set<string>,
): IR.BasicExpression<boolean> | undefined => {
	if (!where || where.type !== "func") return where;
	if (where.name === "and" || where.name === "or") {
		const args = where.args
			.map((a) => without(a, consumed))
			.filter((a) => a !== undefined);
		if (args.length === 0) return undefined;
		if (args.length === 1) return args[0];
		return { ...where, args } as IR.BasicExpression<boolean>;
	}
	if (where.name === "eq" || where.name === "in") {
		const ref = where.args.find((a) => a.type === "ref") as
			| IR.PropRef
			| undefined;
		const field = ref?.path.slice(ref.path.length > 1 ? 1 : 0).join(".");
		if (field !== undefined && consumed.has(field)) return undefined;
	}
	return where;
};

const bindOf = (spec: string | string[] | Bind): Bind =>
	typeof spec === "string" || Array.isArray(spec) ? { field: spec } : spec;

export const kyooCollection = <TItem, TRow extends object>(
	config: KyooCollectionConfig<TItem, TRow>,
) =>
	collectionOptions(config.id, (client: DbClient) => {
		const deps = getDeps(client);
		let writer: Writer<TRow> | null = null;
		const getWriter = () => {
			if (!writer) throw new Error(`${config.id}: sync has not started yet.`);
			return writer;
		};

		type Request = { route: Route; bound: Record<string, string>; params: Params };
		/** Keyset pagination state per request (url without limit). */
		const pages = new Map<
			string,
			{
				request: Request;
				/** Page size of the first request, reused by `refetch`. */
				limit: number;
				/** Url of the next page, null once the api is exhausted. */
				next: string | null;
				/** Rows fetched so far. */
				count: number;
				/** Largest window already answered. */
				served: number;
				/** Loads of one request run one after the other. */
				chain: Promise<unknown>;
			}
		>();

		const api: Api = <T>(
			method: "POST" | "PUT" | "PATCH" | "DELETE",
			path: string[],
			body?: object,
		) => {
			const { apiUrl, authToken, lang } = getDeps(client);
			return queryFn({
				method,
				url: keyToUrl(toQueryKey({ apiUrl, path })),
				body,
				authToken,
				lang,
				parser: null,
			}) as Promise<T>;
		};

		const fetchJson = <Parser extends z.ZodTypeAny>(
			url: string,
			parser: Parser,
			force: boolean,
		): Promise<z.infer<Parser>> => {
			const { queryClient, authToken, lang, staleTime } = getDeps(client);
			return queryClient.fetchQuery({
				queryKey: ["db", config.id, url],
				queryFn: ({ signal }) =>
					queryFn({ url, parser, authToken, lang, signal }),
				staleTime: force ? 0 : staleTime,
				gcTime: 60_000,
			});
		};

		const ingest = (
			items: TItem[],
			bound: Record<string, string>,
			route: Route,
		) => {
			const w = getWriter();
			const stamps = Object.entries(route.bind ?? {})
				.map(([param, spec]) => [param, bindOf(spec)] as const)
				.filter(([, b]) => b.stamp !== false);
			const rows = items.map((item) => {
				const row = config.normalize(item, {
					client,
					existing: (key) => w.get(key),
					bound,
				}) as Record<string, unknown>;
				for (const [param, b] of stamps) {
					const field = Array.isArray(b.field) ? b.field[0]! : b.field;
					if (row[field] === undefined) row[field] = bound[param];
				}
				return row as TRow;
			});
			w.upsert(rows);
		};

		/** Pick the route whose params can all be bound from the where. */
		const resolve = (
			lookups: Map<string, unknown[]>,
			sort: string[],
		):
			| { route: Route; bound: Record<string, string>; consumed: Set<string> }
			| undefined => {
			for (const route of config.routes) {
				if (route.when && !route.when({ sort })) continue;
				const bound: Record<string, string> = {};
				const consumed = new Set<string>();
				let ok = true;
				for (const [param, spec] of Object.entries(route.bind ?? {})) {
					const b = bindOf(spec);
					const fields = Array.isArray(b.field) ? b.field : [b.field];
					const field = fields.find((f) => lookups.get(f)?.length === 1);
					if (!field) {
						ok = false;
						break;
					}
					const value = String(lookups.get(field)![0]);
					bound[param] = b.map ? b.map(value) : value;
					for (const f of fields) consumed.add(f);
				}
				if (ok) return { route, bound, consumed };
			}
			return undefined;
		};

		const urlOf = (
			route: Route,
			bound: Record<string, string>,
			params: Params,
		) =>
			keyToUrl(
				toQueryKey({
					apiUrl: deps.apiUrl,
					path: route.path
						.split("/")
						.filter(Boolean)
						.map((seg) => (seg.startsWith(":") ? bound[seg.slice(1)]! : seg)),
					params: { ...route.params?.(bound), ...params },
				}),
			);

		const loadOne = async (
			route: Route,
			bound: Record<string, string>,
			force: boolean,
		) => {
			const item = await fetchJson(urlOf(route, bound, {}), config.item, force);
			ingest([item], bound, route);
		};

		/**
		 * Load one page for a request whose window reaches `upTo` rows. TanStack
		 * asks again while the window still lacks rows, so a big window (a
		 * persisted db after a restart) costs one round trip per page, and the
		 * same window asked twice (a second identical live query) costs nothing.
		 *
		 * A failure rejects: the live query reports it (`isError`) while local rows
		 * keep rendering, and the next window request tries again.
		 */
		const loadPage = (
			request: Request,
			{ upTo, limit, force }: { upTo: number; limit: number; force: boolean },
		) => {
			const { route, bound, params } = request;
			const base = urlOf(route, bound, params);
			let s = pages.get(base);
			if (!s) {
				s = {
					request,
					limit,
					next: null,
					count: 0,
					served: 0,
					chain: Promise.resolve(),
				};
				pages.set(base, s);
			}
			const state = s;
			const run = async () => {
				if (force) {
					state.count = 0;
					state.served = 0;
					state.next = null;
				}
				if (upTo <= state.served) return;
				const url =
					state.count === 0
						? `${base}${base.includes("?") ? "&" : "?"}limit=${limit}`
						: state.next;
				if (!url) return; // the api has no more pages
				const page = await fetchJson(
					url,
					Paged(config.item),
					force || state.count > 0,
				);
				ingest(page.items, bound, route);
				state.count += page.items.length;
				state.next = page.items.length ? page.next : null;
				state.served = upTo;
			};
			const result = state.chain.then(run, run);
			state.chain = result.catch(() => {});
			return result;
		};

		const load = (
			options: Pick<
				LoadSubsetOptions,
				"where" | "orderBy" | "limit" | "offset"
			>,
			force: boolean,
		): Promise<void> | true => {
			const sort = options.orderBy
				? serializeOrderBy(options.orderBy, config.fields)
				: [];
			const match = resolve(lookupsOf(options.where), sort);
			if (!match) return true; // nothing the api can serve for this query
			const { route, bound, consumed } = match;
			if (route.single) return loadOne(route, bound, force);
			let filter: string | undefined;
			let query: string | undefined;
			try {
				({ filter, query } = serializeWhere(
					without(options.where, consumed),
					config.fields,
				));
			} catch {
				// A local only lookup (by id, a join...): nothing the api can serve.
				return true;
			}
			const limit = options.limit ?? 30;
			return loadPage(
				{
					route,
					bound,
					params: {
						filter,
						query,
						sort: route.sortable === false ? undefined : sort,
					},
				},
				{ upTo: (options.offset ?? 0) + limit, limit, force },
			);
		};

		const utils: KyooUtils<TRow> = {
			writer: getWriter,
			reload: (row) => {
				const route = config.routes.find((r) => r.single);
				if (!route) throw new Error(`${config.id}: no detail route`);
				const bound = Object.fromEntries(
					Object.entries(route.bind ?? {}).map(([param, spec]) => {
						const b = bindOf(spec);
						const field = Array.isArray(b.field) ? b.field[0]! : b.field;
						const value = String((row as Record<string, unknown>)[field]);
						return [param, b.map ? b.map(value) : value];
					}),
				);
				return loadOne(route, bound, true);
			},
			refetch: async () => {
				// Only the first page: rows of later pages stay until the window asks again.
				await Promise.all(
					[...pages.values()].map(({ request, limit }) =>
						loadPage(request, { upTo: limit, limit, force: true }),
					),
				);
			},
		};

		const sync: SyncConfig<TRow, string> = {
			sync: (params) => {
				writer = createWriter<TRow>(params);
				for (const index of config.indexes ?? [])
					params.collection.createIndex(index as any, {
						indexType: BTreeIndex,
					});
				params.markReady();
				deps.refetchers.add(utils.refetch);
				return {
					loadSubset: (options: LoadSubsetOptions) => load(options, false),
					cleanup: () => {
						deps.refetchers.delete(utils.refetch);
					},
				};
			},
		};

		const mutation = (
			handler: ((ctx: MutationContext<TRow>) => Promise<void>) | undefined,
		) =>
			handler &&
			(async ({
				transaction,
			}: {
				transaction: { mutations: PendingMutation<TRow>[] };
			}) => handler({ mutations: transaction.mutations, api, client, utils }));

		return withPersistence(client, {
			id: config.id,
			getKey: config.getKey,
			syncMode: "on-demand",
			startSync: true,
			autoIndex: "eager",
			defaultIndexType: BTreeIndex,
			sync,
			utils,
			onUpdate: mutation(config.onUpdate),
			onDelete: mutation(config.onDelete),
		} satisfies CollectionConfig<TRow, string, never, KyooUtils<TRow>>);
	});
