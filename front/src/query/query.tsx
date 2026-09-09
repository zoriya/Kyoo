import {
	dehydrate,
	type keepPreviousData,
	QueryClient,
	useInfiniteQuery,
	useQuery,
	useQueryClient,
	useMutation as useRQMutation,
} from "@tanstack/react-query";
import { useIsFocused } from "expo-router/react-navigation";
import { useCallback, useContext, useState } from "react";
import { useTranslation } from "react-i18next";
import type { z } from "zod/v4";
import { type KyooError, type Page, Paged } from "~/models";
import { RetryableError } from "~/models/retryable-error";
import { keyToUrl, queryFn, ssrApiUrl, toQueryKey } from "./api";
import { AccountContext } from "~/providers/account-context";
import { setServerData } from "~/utils";

export const createQueryClient = () =>
	new QueryClient({
		defaultOptions: {
			queries: {
				// 5min
				staleTime: 300_000,
				refetchOnWindowFocus: false,
				refetchOnReconnect: false,
				retry: (failureCount: number, error: unknown) => {
					if (failureCount >= 4) return false;
					if (error instanceof RetryableError) return error.key === "offline";
					const status = (error as KyooError | null)?.status;
					return typeof status === "number" && status >= 500;
				},
				retryDelay: (attempt: number) => {
					const base = Math.min(1000 * 2 ** attempt, 10000);
					return base / 2 + Math.random() * (base / 2);
				},
			},
		},
	});

export type QueryIdentifier<T = unknown> = {
	parser: z.ZodType<T> | null;
	path: (string | undefined)[];
	params?: {
		[query: string]: boolean | number | string | string[] | undefined;
	};
	infinite?: boolean;

	placeholderData?: T | (() => T) | typeof keepPreviousData;
	enabled?: boolean;
	refetchInterval?: number;
	options?: Partial<Parameters<typeof queryFn>[0]> & {
		apiUrl?: string;
		returnError?: boolean;
	};
};

export const useFetch = <Data,>(query: QueryIdentifier<Data>) => {
	const { i18n } = useTranslation();
	let { apiUrl, authToken } = useContext(AccountContext);
	if (query.options?.apiUrl) apiUrl = query.options.apiUrl;
	const key = toQueryKey({ apiUrl, path: query.path, params: query.params });
	const focused = useIsFocused();

	const ret = useQuery<Data, KyooError>({
		queryKey: key,
		queryFn: (ctx) =>
			queryFn({
				url: keyToUrl(key),
				parser: query.parser,
				signal: ctx.signal,
				authToken: authToken ?? null,
				lang: i18n.resolvedLanguage,
				...query.options,
			}) as Promise<Data>,
		placeholderData: query.placeholderData as any,
		enabled: query.enabled,
		refetchInterval: query.refetchInterval,
		subscribed: focused,
	});

	if (query.options?.returnError !== true) {
		if (ret.isPaused) throw new RetryableError({ key: "offline" });
		if (ret.error && (ret.error.status === 401 || ret.error.status === 403)) {
			throw new RetryableError({
				key: !authToken ? "needAccount" : "unauthorized",
				inner: ret.error,
			});
		}
		if (ret.error) throw ret.error;
	}

	return ret;
};

export const useRefresh = (queries: QueryIdentifier<unknown>[]) => {
	const [refreshing, setRefreshing] = useState(false);
	const queryClient = useQueryClient();
	const { apiUrl } = useContext(AccountContext);

	const refresh = useCallback(async () => {
		setRefreshing(true);
		await Promise.all(
			queries.map((query) =>
				queryClient.refetchQueries({
					queryKey: toQueryKey({
						apiUrl: query.options?.apiUrl ?? apiUrl,
						path: query.path,
						params: query.params,
					}),
					type: "active",
					exact: true,
				}),
			),
		);
		setRefreshing(false);
	}, [queries, apiUrl, queryClient]);

	return [refreshing, refresh] as const;
};

// Writes a property in place. Kept as a plain function so the React Compiler
// tolerates mutating a value it considers frozen (the react-query result).
const assignField = <T extends object>(
	target: T,
	key: PropertyKey,
	value: unknown,
) => {
	(target as Record<PropertyKey, unknown>)[key] = value;
};

export const useInfiniteFetch = <Data,>(query: QueryIdentifier<Data>) => {
	const { i18n } = useTranslation();
	let { apiUrl, authToken } = useContext(AccountContext);
	if (query.options?.apiUrl) apiUrl = query.options.apiUrl;
	const key = toQueryKey({ apiUrl, path: query.path, params: query.params });
	const focused = useIsFocused();

	const res = useInfiniteQuery<Page<Data>, KyooError>({
		queryKey: key,
		queryFn: (ctx) =>
			queryFn({
				url: (ctx.pageParam as string) ?? keyToUrl(key),
				parser: query.parser ? Paged(query.parser) : null,
				signal: ctx.signal,
				authToken: authToken ?? null,
				lang: i18n.resolvedLanguage,
				...query.options,
			}) as Promise<Page<Data>>,
		getNextPageParam: (page: Page<Data>) => page?.next || undefined,
		initialPageParam: undefined,
		placeholderData: query.placeholderData as any,
		enabled: query.enabled,
		refetchInterval: query.refetchInterval,
		subscribed: focused,
	});
	const ret = res as typeof res & { items?: Data[] };
	// Attach `items` in-place (not via spread, which would broaden react-query's
	// property tracking and re-render all consumers). The write lives in a plain
	// helper so the compiler doesn't see a mutation of the frozen hook result.
	assignField(
		ret,
		"items",
		ret.data?.pages.flatMap((x) => x.items),
	);

	if (ret.isPaused) throw new RetryableError({ key: "offline" });
	if (ret.error && (ret.error.status === 401 || ret.error.status === 403)) {
		throw new RetryableError({ key: "unauthorized", inner: ret.error });
	}
	if (ret.error) throw ret.error;

	return ret;
};

export const prefetch = async (...queries: QueryIdentifier[]) => {
	const client = createQueryClient();
	const authToken = undefined;

	await Promise.all(
		queries
			.filter((x) => x.enabled !== false)
			.map((query) => {
				const key = toQueryKey({
					apiUrl: ssrApiUrl,
					path: query.path,
					params: query.params,
				});

				if (query.infinite) {
					return client.prefetchInfiniteQuery({
						queryKey: key,
						queryFn: (ctx) =>
							queryFn({
								url: keyToUrl(key),
								parser: query.parser ? Paged(query.parser) : null,
								signal: ctx.signal,
								authToken: authToken ?? null,
								...query.options,
							}),
						initialPageParam: undefined,
					});
				}
				return client.prefetchQuery({
					queryKey: key,
					queryFn: (ctx) =>
						queryFn({
							url: keyToUrl(key),
							parser: query.parser,
							signal: ctx.signal,
							authToken: authToken ?? null,
							...query.options,
						}),
				});
			}),
	);
	setServerData("queryState", dehydrate(client));
	return client;
};

type MutationParams<T = unknown> = {
	method?: "POST" | "PUT" | "PATCH" | "DELETE";
	path?: string[];
	params?: {
		[query: string]: boolean | number | string | string[] | undefined;
	};
	body?: object;
	formData?: FormData;
	parser?: z.ZodType<T> | null;
};

export const useMutation = <Ret = unknown, T = void, QueryRet = void>({
	compute,
	invalidate,
	optimistic,
	optimisticKey,
	parser,
	...queryParams
}: MutationParams<Ret> & {
	compute?: (param: T) => MutationParams;
	optimistic?: (param: T, previous?: QueryRet) => QueryRet | undefined;
	optimisticKey?: QueryIdentifier<unknown>;
	invalidate: string[] | null;
}) => {
	const { i18n } = useTranslation();
	const { apiUrl, authToken } = useContext(AccountContext);
	const queryClient = useQueryClient();
	const mutation = useRQMutation({
		mutationFn: (param: T) => {
			const { method, path, params, body, formData } = {
				...queryParams,
				...compute?.(param),
			} as Required<MutationParams>;

			return queryFn({
				method,
				url: keyToUrl(toQueryKey({ apiUrl, path, params })),
				body,
				formData,
				authToken,
				lang: i18n.resolvedLanguage,
				parser: parser ?? null,
			});
		},
		...(invalidate && optimistic
			? {
					onMutate: async (params) => {
						const queryKey = toQueryKey({
							apiUrl,
							path: optimisticKey?.path ?? invalidate,
							params: optimisticKey?.params,
						});
						await queryClient.cancelQueries({
							queryKey,
						});

						const previous = queryClient.getQueryData(queryKey);
						const next = optimistic(params, previous as QueryRet);
						queryClient.setQueryData(queryKey, next);

						return { previous, next };
					},
					onError: (_, __, context) => {
						queryClient.setQueryData(
							toQueryKey({
								apiUrl,
								path: optimisticKey?.path ?? invalidate,
								params: optimisticKey?.params,
							}),
							context!.previous,
						);
					},
				}
			: {}),
		...(invalidate
			? {
					onSettled: async () => {
						await queryClient.invalidateQueries({
							queryKey: toQueryKey({ apiUrl, path: invalidate }),
						});
					},
				}
			: {}),
	});
	return mutation;
};

export { keyToUrl, queryFn, toQueryKey } from "./api";
