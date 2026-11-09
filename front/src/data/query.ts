import {
	useCache,
	useController,
	useDLE as useDataClientDLE,
	useSubscription,
	useSuspense,
} from "@data-client/react";
import {
	Collection,
	type Schema,
	type SchemaSimple,
	type SnapshotInterface,
} from "@data-client/rest";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod/v4";
import { Paged } from "~/models";
import { useToken } from "~/providers/account-context";
import { KyooEndpoint } from "./endpoint";

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
type Path = (string | undefined)[];
export type Params = {
	[query: string]: boolean | number | string | string[] | undefined;
};
export type QuerySchema<Data = unknown> = SchemaSimple<Data> & {
	parser: z.ZodType<Partial<Data>>;
};

export type QueryIdentifier<Data = unknown> = {
	schema: QuerySchema<Data>;
	path: Path;
	params?: Params;
	infinite?: boolean;
	refetchInterval?: number;
	apiUrl?: string;
	enabled?: boolean;
};

const useQueryEndpoint = <S extends Schema>(
	{ path, params, refetchInterval, apiUrl }: QueryIdentifier,
	schema: S,
	parser: z.ZodType,
) => {
	const token = useToken();
	const { i18n } = useTranslation();
	const lang = i18n.resolvedLanguage ?? "en";
	const endpoint = useMemo(
		() =>
			new KyooEndpoint({
				path: "/*path",
				searchParams: {} as Params,
				schema,
				parser,
				paginationField: "next",
				pollFrequency: refetchInterval,
				auth: { ...token, apiUrl: apiUrl ?? token.apiUrl, lang },
			}),
		[schema, parser, refetchInterval, apiUrl, token, lang],
	);
	const args = { path: path.filter((x) => x !== undefined), ...params };
	return { endpoint, args };
};

export function useFetch<Data>(
	query: QueryIdentifier<Data> & { enabled: boolean },
): Data | undefined;
export function useFetch<Data>(query: QueryIdentifier<Data>): Data;
export function useFetch<Data>(query: QueryIdentifier<Data>) {
	const { endpoint, args } = useQueryEndpoint(
		query,
		query.schema,
		query.schema.parser,
	);
	const enabled = query.enabled !== false;
	useSubscription(endpoint, enabled && query.refetchInterval ? args : null);
	return useSuspense(endpoint, enabled ? args : null) as Data | undefined;
}

export const useDLE = <Data>(
	query: QueryIdentifier<Data>,
	opt?: { returnError?: boolean },
) => {
	const { endpoint, args } = useQueryEndpoint(
		query,
		query.schema,
		query.schema.parser,
	);
	const enabled = query.enabled !== false;
	useSubscription(endpoint, enabled && query.refetchInterval ? args : null);
	const { data, loading, error } = useDataClientDLE(
		endpoint,
		enabled ? args : null,
	);
	if (error && !opt?.returnError) throw error;
	return { data: data as Data | undefined, loading, error };
};

export const useCached = <Data>(query: QueryIdentifier<Data>) => {
	const { endpoint, args } = useQueryEndpoint(
		query,
		query.schema,
		query.schema.parser,
	);
	return useCache(endpoint, args) as Data | undefined;
};

export const useInfiniteFetch = <Data>(query: QueryIdentifier<Data>) => {
	const ctrl = useController();
	const [schema, parser] = useMemo(
		() =>
			[
				{ items: new Collection([query.schema]), next: "" as string | null },
				Paged(query.schema.parser),
			] as const,
		[query.schema],
	);
	const { endpoint, args } = useQueryEndpoint(query, schema, parser);
	useSubscription(endpoint, query.refetchInterval ? args : null);
	const data = useSuspense(endpoint, args);
	const [isRefetching, setRefetching] = useState(false);
	const [isFetchingNextPage, setFetchingNextPage] = useState(false);

	return {
		items: data.items,
		hasNextPage: !!data.next,
		isFetching: isFetchingNextPage,
		fetchNextPage: async () => {
			if (!data.next || isFetchingNextPage) return false;
			setFetchingNextPage(true);
			return ctrl
				.fetch(endpoint.getPage, { ...args, next: data.next })
				.then(
					() => true,
					() => false,
				)
				.finally(() => setFetchingNextPage(false));
		},
		refetch: async () => {
			setRefetching(true);
			await ctrl
				.fetch(endpoint, args)
				.catch(() => {})
				.finally(() => setRefetching(false));
		},
		isRefetching,
	};
};

export const useInvalidate = () => {
	const ctrl = useController();
	const { apiUrl } = useToken();
	return (target: Path | { path: Path; nested: boolean }) => {
		const { path, nested } = Array.isArray(target)
			? { path: target, nested: false }
			: target;
		const prefix = `GET ${apiUrl.replace(/\/$/, "")}/${path.filter((x) => x !== undefined).join("/")}`;
		return ctrl.expireAll({
			testKey: (key) =>
				key.startsWith(prefix) &&
				(nested ? /^($|[/?])/ : /^($|\?)/).test(key.slice(prefix.length)),
		});
	};
};

export type Mutation<Data = unknown> = {
	method?: Method;
	path: Path;
	params?: Params;
	body?: object | FormData;
	apiUrl?: string;
	// `null` sends the request without the current account's token
	authToken?: string | null;
	signal?: AbortSignal;
	invalidate?: Path | { path: Path; nested: boolean };
	// if set, validates the api answer and refreshed the data-store with it.
	schema?: QuerySchema<Data>;
	// uses return value as assumed network response
	optimistic?: (snapshot: SnapshotInterface) => unknown;
	// use if the api doesn't return the edited schema (if it returns a sub-object or 204)
	// should NOT be used with `schema`.
	optimisticSchema?: Schema;
};

export const useMutation = <T = void, Data = unknown>(
	request: (param: T) => Mutation<Data>,
) => {
	const ctrl = useController();
	const token = useToken();
	const { i18n } = useTranslation();
	const expire = useInvalidate();
	const [isPending, setPending] = useState(false);

	const mutate = async (param: T) => {
		const {
			method = "POST",
			path,
			params,
			body,
			apiUrl,
			authToken,
			signal,
			schema,
			optimistic,
			optimisticSchema,
			invalidate,
		} = request(param);
		let answer: unknown;
		const endpoint = new KyooEndpoint({
			path: "/*path",
			method,
			body,
			signal,
			schema: optimisticSchema ?? schema,
			parser: optimisticSchema
				? z.unknown().transform(() => answer)
				: (schema?.parser ?? z.unknown()),
			auth: {
				apiUrl: apiUrl ?? token.apiUrl,
				authToken: authToken === undefined ? token.authToken : authToken,
				lang: i18n.resolvedLanguage ?? "en",
			},
			getOptimisticResponse: (snap: SnapshotInterface, ..._args: unknown[]) => {
				if (!optimistic) throw snap.abort;
				answer = optimistic(snap);
				return answer;
			},
		});
		setPending(true);
		try {
			const args = { path: path.filter((x) => x !== undefined), ...params };
			const ret = (await (body === undefined
				? ctrl.fetch(endpoint, args)
				: ctrl.fetch(endpoint, args, body))) as Data;
			if (invalidate) await expire(invalidate);
			return ret;
		} finally {
			setPending(false);
		}
	};

	return {
		mutate,
		isPending,
	};
};

export const useRefresh = (queries: QueryIdentifier[]) => {
	const ctrl = useController();
	const token = useToken();
	const { i18n } = useTranslation();
	const [refreshing, setRefreshing] = useState(false);

	const refresh = async () => {
		setRefreshing(true);
		await Promise.all(
			queries.map(({ schema, infinite, path, params, apiUrl }) =>
				ctrl.fetch(
					new KyooEndpoint({
						path: "/*path",
						searchParams: {} as Params,
						...(infinite
							? {
									schema: {
										items: new Collection([schema]),
										next: "" as string | null,
									},
									parser: Paged(schema.parser),
								}
							: { schema, parser: schema.parser }),
						auth: {
							...token,
							apiUrl: apiUrl ?? token.apiUrl,
							lang: i18n.resolvedLanguage ?? "en",
						},
					}),
					{ path: path.filter((x) => x !== undefined), ...params },
				),
			),
		).catch(() => {});
		setRefreshing(false);
	};

	return [refreshing, refresh] as const;
};
