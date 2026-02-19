import {
	dehydrate,
	QueryClient,
	useInfiniteQuery,
	useQuery,
	useQueryClient,
	useMutation as useRQMutation,
} from "@tanstack/react-query";
import { useCallback, useContext, useState } from "react";
import { Platform } from "react-native";
import type { z } from "zod/v4";
import { type KyooError, type Page, Paged } from "~/models";
import { RetryableError } from "~/models/retryable-error";
import { AccountContext } from "~/providers/account-context";
import { setServerData } from "~/utils";

const ssrApiUrl = process.env.KYOO_URL ?? "http://api:3567/api";

const cleanSlash = (str: string | null) => {
	if (str === null) return null;
	return str.replace(/\/$/g, "");
};

export const queryFn = async <Parser extends z.ZodTypeAny>(context: {
	method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
	url: string;
	body?: object;
	formData?: FormData;
	plainText?: boolean;
	authToken: string | null;
	parser: Parser | null;
	signal?: AbortSignal;
}): Promise<z.infer<Parser>> => {
	if (
		Platform.OS === "web" &&
		typeof window === "undefined" &&
		context.url.startsWith("/")
	)
		context.url = `${ssrApiUrl}${context.url}`;
	let resp: Response;
	try {
		resp = await fetch(context.url, {
			method: context.method,
			body:
				"body" in context && context.body
					? JSON.stringify(context.body)
					: "formData" in context && context.formData
						? context.formData
						: undefined,
			headers: {
				...(context.authToken
					? { Authorization: `Bearer ${context.authToken}` }
					: {}),
				...("body" in context ? { "Content-Type": "application/json" } : {}),
			},
			signal: context.signal,
		});
	} catch (e) {
		if (typeof e === "object" && e && "name" in e && e.name === "AbortError")
			throw { message: "Aborted", status: "aborted" } as KyooError;
		console.log("Fetch error", e, context.url);
		throw new RetryableError({
			key: "offline",
		});
	}
	if (resp.status === 404) {
		throw { message: "Resource not found.", status: 404 } as KyooError;
	}
	if (!resp.ok) {
		const error = await resp.text();
		let data: Record<string, any>;
		try {
			data = JSON.parse(error);
		} catch (e) {
			data = { message: error } as KyooError;
		}
		data.status = resp.status;
		console.log(
			`Invalid response (${context.method ?? "GET"} ${context.url}):`,
			data,
			resp.status,
		);
		throw data as KyooError;
	}

	if (resp.status === 204) return null!;

	if (context.plainText) return (await resp.text()) as any;

	let data: Record<string, any>;
	try {
		data = await resp.json();
	} catch (e) {
		console.error("Invalid json from kyoo", e);
		throw {
			message: `Invalid response from kyoo at ${context.url}`,
			status: "json",
		} as KyooError;
	}
	if (!context.parser) return data as any;
	const parsed = await context.parser.safeParseAsync(data);
	if (!parsed.success) {
		console.log(
			"Url: ",
			context.url,
			" Response: ",
			resp.status,
			" Parse error: ",
			parsed.error,
		);
		console.log(parsed.error.issues);
		throw {
			status: "parse",
			message:
				"Invalid response from kyoo. Possible version mismatch between the server and the application.",
		} as KyooError;
	}
	return parsed.data;
};

export const createQueryClient = () =>
	new QueryClient({
		defaultOptions: {
			queries: {
				// 5min
				staleTime: 300_000,
				refetchOnWindowFocus: false,
				refetchOnReconnect: false,
				retry: false,
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

	placeholderData?: T | (() => T);
	enabled?: boolean;
	options?: Partial<Parameters<typeof queryFn>[0]> & {
		apiUrl?: string;
		returnError?: boolean;
	};
};

const toQueryKey = (query: {
	apiUrl: string;
	path: (string | undefined)[];
	params?: {
		[query: string]: boolean | number | string | string[] | undefined;
	};
}) => {
	return [
		cleanSlash(query.apiUrl),
		...query.path,
		query.params
			? `?${Object.entries(query.params)
					.filter(
						([_, v]) =>
							v !== undefined && (Array.isArray(v) ? v.length > 0 : true),
					)
					.map(([k, v]) => `${k}=${Array.isArray(v) ? v.join(",") : v}`)
					.join("&")}`
			: undefined,
	].filter((x) => x !== undefined);
};

export const keyToUrl = (key: ReturnType<typeof toQueryKey>) => {
	return key.join("/").replace("/?", "?");
};

export const useFetch = <Data,>(query: QueryIdentifier<Data>) => {
	let { apiUrl, authToken, selectedAccount } = useContext(AccountContext);
	if (query.options?.apiUrl) apiUrl = query.options.apiUrl;
	const key = toQueryKey({ apiUrl, path: query.path, params: query.params });

	const ret = useQuery<Data, KyooError>({
		queryKey: key,
		queryFn: (ctx) =>
			queryFn({
				url: keyToUrl(key),
				parser: query.parser,
				signal: ctx.signal,
				authToken: authToken ?? null,
				...query.options,
			}) as Promise<Data>,
		placeholderData: query.placeholderData as any,
		enabled: query.enabled,
	});

	if (query.options?.returnError !== true) {
		if (ret.isPaused) throw new RetryableError({ key: "offline" });
		if (ret.error && (ret.error.status === 401 || ret.error.status === 403)) {
			throw new RetryableError({
				key: !selectedAccount ? "needAccount" : "unauthorized",
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

export const useInfiniteFetch = <Data,>(query: QueryIdentifier<Data>) => {
	let { apiUrl, authToken } = useContext(AccountContext);
	if (query.options?.apiUrl) apiUrl = query.options.apiUrl;
	const key = toQueryKey({ apiUrl, path: query.path, params: query.params });

	const res = useInfiniteQuery<Page<Data>, KyooError>({
		queryKey: key,
		queryFn: (ctx) =>
			queryFn({
				url: (ctx.pageParam as string) ?? keyToUrl(key),
				parser: query.parser ? Paged(query.parser) : null,
				signal: ctx.signal,
				authToken: authToken ?? null,
				...query.options,
			}) as Promise<Page<Data>>,
		getNextPageParam: (page: Page<Data>) => page?.next || undefined,
		initialPageParam: undefined,
		placeholderData: query.placeholderData as any,
		enabled: query.enabled,
	});
	const ret = res as typeof res & { items?: Data[] };
	ret.items = ret.data?.pages.flatMap((x) => x.items);

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

type MutationParams = {
	method?: "POST" | "PUT" | "PATCH" | "DELETE";
	path?: string[];
	params?: {
		[query: string]: boolean | number | string | string[] | undefined;
	};
	body?: object;
};

export const useMutation = <T = void, QueryRet = void>({
	compute,
	invalidate,
	optimistic,
	...queryParams
}: MutationParams & {
	compute?: (param: T) => MutationParams;
	optimistic?: (param: T, previous?: QueryRet) => QueryRet | undefined;
	invalidate: string[] | null;
}) => {
	const { apiUrl, authToken } = useContext(AccountContext);
	const queryClient = useQueryClient();
	const mutation = useRQMutation({
		mutationFn: (param: T) => {
			const { method, path, params, body } = {
				...queryParams,
				...compute?.(param),
			} as Required<MutationParams>;

			return queryFn({
				method,
				url: keyToUrl(toQueryKey({ apiUrl, path, params })),
				body,
				authToken,
				parser: null,
			});
		},
		...(invalidate && optimistic
			? {
					onMutate: async (params) => {
						const queryKey = toQueryKey({ apiUrl, path: invalidate });
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
							toQueryKey({ apiUrl, path: invalidate }),
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
