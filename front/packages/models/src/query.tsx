/*
 * Kyoo - A portable and vast media library solution.
 * Copyright (c) Kyoo.
 *
 * See AUTHORS.md and LICENSE file in the project root for full license information.
 *
 * Kyoo is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * any later version.
 *
 * Kyoo is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Kyoo. If not, see <https://www.gnu.org/licenses/>.
 */

import { ComponentType, ReactElement } from "react";
import {
	dehydrate,
	QueryClient,
	QueryFunctionContext,
	useInfiniteQuery,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { z } from "zod";
import { KyooErrors } from "./kyoo-errors";
import { Page, Paged } from "./page";
import { getToken } from "./login";
import { getCurrentApiUrl } from ".";

export let lastUsedUrl: string = null!;

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
	token?: string | null,
): Promise<z.infer<Parser>> => {
	const url = context.apiUrl ?? getCurrentApiUrl();
	lastUsedUrl = url!;

	if (token === undefined && context.authenticated !== false) token = await getToken();
	const path = [url]
		.concat(
			"path" in context
				? (context.path as string[])
				: "pageParam" in context && context.pageParam
					? [context.pageParam as string]
					: (context.queryKey as string[]),
		)
		.filter((x) => x)
		.join("/")
		.replace("/?", "?");
	let resp;
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
			throw { errors: ["Aborted"] } as KyooErrors;
		console.log("Fetch error", e, path);
		throw { errors: ["Could not reach Kyoo's server."] } as KyooErrors;
	}
	if (resp.status === 404) {
		throw { errors: ["Resource not found."] } as KyooErrors;
	}
	if (!resp.ok) {
		const error = await resp.text();
		let data;
		try {
			data = JSON.parse(error);
		} catch (e) {
			data = { errors: [error] } as KyooErrors;
		}
		console.log(
			`Invalid response (${
				"method" in context && context.method ? context.method : "GET"
			} ${path}):`,
			data,
			resp.status,
		);
		throw data as KyooErrors;
	}

	if (resp.status === 204) return null;

	if ("plainText" in context && context.plainText) return (await resp.text()) as unknown;

	let data;
	try {
		data = await resp.json();
	} catch (e) {
		console.error("Invalid json from kyoo", e);
		throw { errors: ["Invalid response from kyoo"] };
	}
	if (!type) return data;
	const parsed = await type.safeParseAsync(data);
	if (!parsed.success) {
		console.log("Path: ", path, " Response: ", resp.status, " Parse error: ", parsed.error);
		throw {
			errors: [
				"Invalid response from kyoo. Possible version mismatch between the server and the application.",
			],
		} as KyooErrors;
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
			? "?" +
				Object.entries(query.params)
					.filter(([_, v]) => v !== undefined)
					.map(([k, v]) => `${k}=${Array.isArray(v) ? v.join(",") : v}`)
					.join("&")
			: null,
	].filter((x) => x);
};

export const useFetch = <Data,>(query: QueryIdentifier<Data>) => {
	return useQuery<Data, KyooErrors>({
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
	const ret = useInfiniteQuery<Page<Data>, KyooErrors>({
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
	// we can't put this check in a function because we want build time optimizations
	// see https://github.com/vercel/next.js/issues/5354 for details
	if (typeof window !== "undefined") return {};

	const client = createQueryClient();
	await Promise.all(
		queries.map((query) => {
			if (query.infinite) {
				return client.prefetchInfiniteQuery({
					queryKey: toQueryKey(query),
					queryFn: (ctx) => queryFn(ctx, Paged(query.parser), authToken),
					initialPageParam: undefined,
				});
			} else {
				return client.prefetchQuery({
					queryKey: toQueryKey(query),
					queryFn: (ctx) => queryFn(ctx, query.parser, authToken),
				});
			}
		}),
	);
	return dehydrate(client);
};
