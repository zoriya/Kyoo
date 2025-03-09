import { QueryClient, dehydrate, useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { setServerData } from "one";
import { useContext } from "react";
import { Platform } from "react-native";
import type { z } from "zod";
import { type KyooError, type Page, Paged } from "~/models";
import { AccountContext } from "~/providers/account-context";

const ssrApiUrl = process.env.KYOO_URL ?? "http://back/api";

const cleanSlash = (str: string | null, keepFirst = false) => {
	if (!str) return null;
	if (keepFirst) return str.replace(/\/$/g, "");
	return str.replace(/^\/|\/$/g, "");
};

export const queryFn = async <Parser extends z.ZodTypeAny>(context: {
	method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
	url: string;
	body?: object;
	formData?: FormData;
	plainText?: boolean;
	authToken: string | null;
	parser?: Parser;
	signal: AbortSignal;
}): Promise<z.infer<Parser>> => {
	if (Platform.OS === "web" && typeof window === "undefined" && context.url.startsWith("/api"))
		context.url = `${ssrApiUrl}/${context.url.substring(4)}`;
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
				...(context.authToken ? { Authorization: `Bearer ${context.authToken}` } : {}),
				...("body" in context ? { "Content-Type": "application/json" } : {}),
			},
			signal: context.signal,
		});
	} catch (e) {
		if (typeof e === "object" && e && "name" in e && e.name === "AbortError")
			throw { message: "Aborted", status: "aborted" } as KyooError;
		console.log("Fetch error", e, context.url);
		throw { message: "Could not reach Kyoo's server.", status: "aborted" } as KyooError;
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
		console.log(`Invalid response (${context.method ?? "GET"} ${context.url}):`, data, resp.status);
		throw data as KyooError;
	}

	if (resp.status === 204) return null;

	if (context.plainText) return (await resp.text()) as unknown;

	let data: Record<string, any>;
	try {
		data = await resp.json();
	} catch (e) {
		console.error("Invalid json from kyoo", e);
		throw { message: "Invalid response from kyoo", status: "json" } as KyooError;
	}
	if (!context.parser) return data;
	const parsed = await context.parser.safeParseAsync(data);
	if (!parsed.success) {
		console.log("Url: ", context.url, " Response: ", resp.status, " Parse error: ", parsed.error);
		throw {
			status: "parse",
			message:
				"Invalid response from kyoo. Possible version mismatch between the server and the application.",
		} as KyooError;
	}
	return parsed.data;
};

export type MutationParam = {
	params?: Record<string, number | string>;
	body?: object;
	path: string[];
	method: "POST" | "DELETE";
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
			mutations: {
				mutationFn: (({ method, path, body, params }: MutationParam) => {
					return queryFn({
						method,
						path: toQueryKey({ path, params }),
						body,
					});
				}) as any,
			},
		},
	});

export type QueryIdentifier<T = unknown, Ret = T> = {
	parser: z.ZodType<T, z.ZodTypeDef, any>;
	path: (string | undefined)[];
	params?: { [query: string]: boolean | number | string | string[] | undefined };
	infinite?: boolean | { value: true; map?: (x: any[]) => Ret[] };

	placeholderData?: T | (() => T);
	enabled?: boolean;
	options?: Partial<Parameters<typeof queryFn>[0]> & {
		apiUrl?: string;
	};
};

export const toQueryKey = (query: {
	apiUrl: string;
	path: (string | undefined)[];
	params?: { [query: string]: boolean | number | string | string[] | undefined };
}) => {
	return [
		cleanSlash(query.apiUrl, true),
		...query.path,
		query.params
			? `?${Object.entries(query.params)
					.filter(([_, v]) => v !== undefined)
					.map(([k, v]) => `${k}=${Array.isArray(v) ? v.join(",") : v}`)
					.join("&")}`
			: null,
	].filter((x) => x);
};

export const useFetch = <Data,>(query: QueryIdentifier<Data>) => {
	const { apiUrl, authToken } = useContext(AccountContext);
	const key = toQueryKey({ apiUrl, path: query.path, params: query.params });

	return useQuery<Data, KyooError>({
		queryKey: key,
		queryFn: (ctx) =>
			queryFn({
				url: key.join("/").replace("/?", "?"),
				parser: query.parser,
				signal: ctx.signal,
				authToken: authToken?.access_token ?? null,
				...query.options,
			}),
		placeholderData: query.placeholderData as any,
		enabled: query.enabled,
	});
};

export const useInfiniteFetch = <Data, Ret>(query: QueryIdentifier<Data, Ret>) => {
	const { apiUrl, authToken } = useContext(AccountContext);
	const key = toQueryKey({ apiUrl, path: query.path, params: query.params });

	const ret = useInfiniteQuery<Page<Data>, KyooError>({
		queryKey: key,
		queryFn: (ctx) =>
			queryFn({
				url: (ctx.pageParam as string) ?? key.join("/").replace("/?", "?"),
				parser: Paged(query.parser),
				signal: ctx.signal,
				authToken: authToken?.access_token ?? null,
				...query.options,
			}),
		getNextPageParam: (page: Page<Data>) => page?.next || undefined,
		initialPageParam: undefined,
		placeholderData: query.placeholderData as any,
		enabled: query.enabled,
	});
	const items = ret.data?.pages.flatMap((x) => x.items);
	return {
		...ret,
		items:
			items && typeof query.infinite === "object" && query.infinite.map
				? query.infinite.map(items)
				: (items as unknown as Ret[] | undefined),
	};
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
								url: key.join("/").replace("/?", "?"),
								parser: Paged(query.parser),
								signal: ctx.signal,
								authToken: authToken?.access_token ?? null,
								...query.options,
							}),
						initialPageParam: undefined,
					});
				}
				return client.prefetchQuery({
					queryKey: key,
					queryFn: (ctx) =>
						queryFn({
							url: key.join("/").replace("/?", "?"),
							parser: query.parser,
							signal: ctx.signal,
							authToken: authToken?.access_token ?? null,
							...query.options,
						}),
				});
			}),
	);
	setServerData("queryState", dehydrate(client));
	return client;
};
