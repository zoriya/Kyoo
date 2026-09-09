import type { PersistedCollectionPersistence } from "@tanstack/db-sqlite-persistence-core";
import { DbClient } from "@tanstack/react-db";
import type { QueryClient } from "@tanstack/react-query";

/**
 * What a collection needs to talk to kyoo. Collections never read react
 * context: they get these through the `DbClient` they were materialized with,
 * so there is exactly one set of collections per account.
 */
export type KyooDbDeps = {
	apiUrl: string;
	authToken: string | null;
	lang: string;
	queryClient: QueryClient;
	/** Optional local persistence (sqlite on native). `undefined` = memory only. */
	persistence?: PersistedCollectionPersistence;
	/** How long a fetched page/row is considered fresh (ms). */
	staleTime: number;
	/** Refetch hooks of every materialized collection (pull to refresh). */
	refetchers: Set<() => Promise<void>>;
};

export const defaultStaleTime = 300_000;

type Lazy<T> = T | (() => T);
const resolve = <T>(v: Lazy<T>): T =>
	typeof v === "function" ? (v as () => T)() : v;

/**
 * `authToken` and `lang` can be getters: they change without the data having
 * to be thrown away (a token refresh must not rebuild every collection).
 */
export const createDbClient = ({
	authToken,
	lang,
	staleTime = defaultStaleTime,
	...deps
}: Pick<KyooDbDeps, "apiUrl" | "queryClient" | "persistence"> & {
	authToken: Lazy<string | null>;
	lang: Lazy<string>;
	staleTime?: number;
}) =>
	new DbClient({
		...deps,
		staleTime,
		refetchers: new Set(),
		get authToken() {
			return resolve(authToken);
		},
		get lang() {
			return resolve(lang);
		},
	});

export const getDeps = (client: DbClient): KyooDbDeps => ({
	apiUrl: client.requireDependency<string>("apiUrl"),
	authToken: client.getDependency<string | null>("authToken") ?? null,
	lang: client.getDependency<string>("lang") ?? "en",
	queryClient: client.requireDependency<QueryClient>("queryClient"),
	persistence:
		client.getDependency<PersistedCollectionPersistence>("persistence"),
	staleTime: client.getDependency<number>("staleTime") ?? defaultStaleTime,
	refetchers: client.requireDependency<Set<() => Promise<void>>>("refetchers"),
});

/** Re-fetch the first page of everything currently displayed (pull to refresh). */
export const refetchAll = async (client: DbClient) => {
	const results = await Promise.allSettled(
		[...getDeps(client).refetchers].map((x) => x()),
	);
	for (const r of results)
		if (r.status === "rejected") console.log("[db] refetch failed", r.reason);
};
