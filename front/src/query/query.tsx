import {
	QueryClient,
	type QueryFunctionContext,
	useInfiniteQuery,
	useQuery,
} from "@tanstack/react-query";
import type { ComponentType, ReactElement } from "react";
import type { z } from "zod";
import { type KyooError, type Page, Paged } from "~/models";
// import { getToken, getTokenWJ } from "./login";

export let lastUsedUrl: string = null!;

const cleanSlash = (str: string | null, keepFirst = false) => {
	if (!str) return null;
	if (keepFirst) return str.replace(/\/$/g, "");
	return str.replace(/^\/|\/$/g, "");
};

export const queryFn = async <Parser extends z.ZodTypeAny>(
	context: {
		apiUrl?: string | null;
		authenticated?: boolean;
		method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
	} & (
		| QueryFunctionContext
		| ({
				path: (string | false | undefined | null)[];
				body?: object;
				formData?: FormData;
				plainText?: boolean;
		  } & Partial<QueryFunctionContext>)
	),
	type?: Parser,
	iToken?: string | null,
): Promise<z.infer<Parser>> => {
	const url = context.apiUrl && context.apiUrl.length > 0 ? context.apiUrl : getCurrentApiUrl();
	lastUsedUrl = url!;

	const token = iToken === undefined && context.authenticated !== false ? await getToken() : iToken;
	const path = [cleanSlash(url, true)]
		.concat(
			"path" in context
				? (context.path as string[])
				: "pageParam" in context && context.pageParam
					? [cleanSlash(context.pageParam as string)]
					: (context.queryKey as string[]),
		)
		.filter((x) => x)
		.join("/")
		.replace("/?", "?");
	let resp: Response;
	try {
		resp = await fetch(path, {
			method: context.method,
			body:
				"body" in context && context.body
					? JSON.stringify(context.body)
					: "formData" in context && context.formData
						? context.formData
						: undefined,
			headers: {
				...(token ? { Authorization: token } : {}),
				...("body" in context ? { "Content-Type": "application/json" } : {}),
			},
			signal: context.signal,
		});
	} catch (e) {
		if (typeof e === "object" && e && "name" in e && e.name === "AbortError")
			throw { message: "Aborted", status: "aborted" } as KyooError;
		console.log("Fetch error", e, path);
		throw { message: "Could not reach Kyoo's server.", status: "aborted" } as KyooError;
	}
	if (resp.status === 404) {
		throw { message: "Resource not found.", status: 404 } as KyooError;
	}
	// If we got a forbidden, try to refresh the token
	// if we got a token as an argument, it either means we already retried or we go one provided that's fresh
	// so we can't retry either ways.
	if (resp.status === 403 && iToken === undefined && token) {
		const [newToken, _, error] = await getTokenWJ(undefined, true);
		if (newToken) return await queryFn(context, type, newToken);
		console.error("refresh error while retrying a forbidden", error);
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
		console.trace(
			`Invalid response (${
				"method" in context && context.method ? context.method : "GET"
			} ${path}):`,
			data,
			resp.status,
		);
		throw data as KyooError;
	}

	if (resp.status === 204) return null;

	if ("plainText" in context && context.plainText) return (await resp.text()) as unknown;

	let data: Record<string, any>;
	try {
		data = await resp.json();
	} catch (e) {
		console.error("Invalid json from kyoo", e);
		throw { message: "Invalid response from kyoo", status: "json" } as KyooError;
	}
	if (!type) return data;
	const parsed = await type.safeParseAsync(data);
	if (!parsed.success) {
		console.log("Path: ", path, " Response: ", resp.status, " Parse error: ", parsed.error);
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
	options?: Partial<Parameters<typeof queryFn>[0]>;
};

export type QueryPage<Props = {}, Items = unknown> = ComponentType<
	Props & { randomItems: Items[] }
> & {
	getFetchUrls?: (route: { [key: string]: string }, randomItems: Items[]) => QueryIdentifier<any>[];
	getLayout?:
		| QueryPage<{ page: ReactElement }>
		| { Layout: QueryPage<{ page: ReactElement }>; props: object };
	requiredPermissions?: string[];
	randomItems?: Items[];
	isPublic?: boolean;
};

export const toQueryKey = (query: {
	path: (string | undefined)[];
	params?: { [query: string]: boolean | number | string | string[] | undefined };
	options?: { apiUrl?: string | null };
}) => {
	return [
		query.options?.apiUrl,
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
	return useQuery<Data, KyooError>({
		queryKey: toQueryKey(query),
		queryFn: (ctx) =>
			queryFn(
				{
					...ctx,
					queryKey: toQueryKey({ ...query, options: {} }),
					...query.options,
				},
				query.parser,
			),
		placeholderData: query.placeholderData as any,
		enabled: query.enabled,
	});
};

export const useInfiniteFetch = <Data, Ret>(query: QueryIdentifier<Data, Ret>) => {
	const ret = useInfiniteQuery<Page<Data>, KyooError>({
		queryKey: toQueryKey(query),
		queryFn: (ctx) =>
			queryFn(
				{ ...ctx, queryKey: toQueryKey({ ...query, options: {} }), ...query.options },
				Paged(query.parser),
			),
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

export const fetchQuery = async (queries: QueryIdentifier[], authToken?: string | null) => {
	const client = createQueryClient();
	await Promise.all(
		queries.map((query) => {
			if (query.infinite) {
				return client.prefetchInfiniteQuery({
					queryKey: toQueryKey(query),
					queryFn: (ctx) => queryFn(ctx, Paged(query.parser), authToken),
					initialPageParam: undefined,
				});
			}
			return client.prefetchQuery({
				queryKey: toQueryKey(query),
				queryFn: (ctx) => queryFn(ctx, query.parser, authToken),
			});
		}),
	);
	return client;
};
