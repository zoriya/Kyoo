import {
	dehydrate,
	QueryClient,
	useInfiniteQuery,
	useQuery,
	useQueryClient,
	useMutation as useRQMutation,
} from "@tanstack/react-query";
import { useContext } from "react";
import { Platform } from "react-native";
import type { z } from "zod/v4";
import { type KyooError, type Page, Paged } from "~/models";
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
		throw {
			message: "Could not reach Kyoo's server.",
			status: "aborted",
		} as KyooError;
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
			message: "Invalid response from kyoo",
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
					.filter(([_, v]) => v !== undefined)
					.map(([k, v]) => `${k}=${Array.isArray(v) ? v.join(",") : v}`)
					.join("&")}`
			: null,
	].filter((x) => x !== undefined);
};

export const keyToUrl = (key: ReturnType<typeof toQueryKey>) => {
	return key.join("/").replace("/?", "?");
};

export const useFetch = <Data,>(query: QueryIdentifier<Data>) => {
	let { apiUrl, authToken } = useContext(AccountContext);
	if (query.options?.apiUrl) apiUrl = query.options.apiUrl;
	const key = toQueryKey({ apiUrl, path: query.path, params: query.params });

	return useQuery<Data, KyooError>({
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
	method?: "POST" | "PUT" | "DELETE";
	path?: string[];
	params?: {
		[query: string]: boolean | number | string | string[] | undefined;
	};
	body?: object;
};

export const useMutation = <T = void>({
	compute,
	invalidate,
	...queryParams
}: MutationParams & {
	compute?: (param: T) => MutationParams;
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
		onSuccess: invalidate
			? async () =>
					await queryClient.invalidateQueries({
						queryKey: toQueryKey({ apiUrl, path: invalidate }),
					})
			: undefined,
		// TODO: Do something
		// onError: () => {}
	});
	return mutation;
};
