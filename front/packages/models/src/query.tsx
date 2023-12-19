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
	useMutation,
	useQuery,
} from "@tanstack/react-query";
import { z } from "zod";
import { KyooErrors } from "./kyoo-errors";
import { Page, Paged } from "./page";
import { Platform } from "react-native";
import { getToken } from "./login";
import { getCurrentAccount } from "./account-internal";

const kyooUrl =
	typeof window === "undefined" ? process.env.KYOO_URL ?? "http://localhost:5000" : "/api";
// The url of kyoo, set after each query (used by the image parser).
export let kyooApiUrl = kyooUrl;

export const queryFn = async <Data,>(
	context:
		| (QueryFunctionContext & { timeout?: number; apiUrl?: string })
		| {
				path: (string | false | undefined | null)[];
				body?: object;
				method: "GET" | "POST" | "DELETE";
				authenticated?: boolean;
				apiUrl?: string;
				timeout?: number;
		  },
	type?: z.ZodType<Data>,
	token?: string | null,
): Promise<Data> => {
	const url = context.apiUrl ?? (Platform.OS === "web" ? kyooUrl : getCurrentAccount()!.apiUrl);
	kyooApiUrl = url;

	// @ts-ignore
	if (token === undefined && context.authenticated !== false) token = await getToken();
	const path = [url]
		.concat(
			"path" in context
				? (context.path.filter((x) => x) as string[])
				: "pageParam" in context && context.pageParam
				  ? [context.pageParam as string]
				  : (context.queryKey.filter((x) => x) as string[]),
		)
		.join("/")
		.replace("/?", "?");
	let resp;
	try {
		const controller = context.timeout !== undefined ? new AbortController() : undefined;
		if (controller) setTimeout(() => controller.abort(), context.timeout);

		resp = await fetch(path, {
			// @ts-ignore
			method: context.method,
			// @ts-ignore
			body: context.body ? JSON.stringify(context.body) : undefined,
			headers: {
				...(token ? { Authorization: token } : {}),
				...("body" in context ? { "Content-Type": "application/json" } : {}),
			},
			signal: controller?.signal,
		});
	} catch (e) {
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

	// @ts-expect-error Assume Data is nullable.
	if (resp.status === 204) return null;

	let data;
	try {
		data = await resp.json();
	} catch (e) {
		console.error("Invald json from kyoo", e);
		throw { errors: ["Invalid repsonse from kyoo"] };
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
	timeout?: number;
};

export type QueryPage<Props = {}, Items = unknown> = ComponentType<
	Props & { randomItems: Items[] }
> & {
	getFetchUrls?: (route: { [key: string]: string }, randomItems: Items[]) => QueryIdentifier<any>[];
	getLayout?:
		| QueryPage<{ page: ReactElement }>
		| { Layout: QueryPage<{ page: ReactElement }>; props: object };
	randomItems?: Items[];
};

export const toQueryKey = (query: {
	path: (string | undefined)[];
	params?: { [query: string]: boolean | number | string | string[] | undefined };
}) => {
	if (query.params) {
		return [
			...query.path,
			"?" +
				Object.entries(query.params)
					.filter(([_, v]) => v !== undefined)
					.map(([k, v]) => `${k}=${Array.isArray(v) ? v.join(",") : v}`)
					.join("&"),
		];
	} else {
		return query.path;
	}
};

export const useFetch = <Data,>(query: QueryIdentifier<Data>) => {
	return useQuery<Data, KyooErrors>({
		queryKey: toQueryKey(query),
		queryFn: (ctx) => queryFn({ ...ctx, timeout: query.timeout }, query.parser),
		placeholderData: query.placeholderData as any,
		enabled: query.enabled,
	});
};

export const useInfiniteFetch = <Data, Ret>(query: QueryIdentifier<Data, Ret>) => {
	const ret = useInfiniteQuery<Page<Data>, KyooErrors>({
		queryKey: toQueryKey(query),
		queryFn: (ctx) => queryFn({ ...ctx, timeout: query.timeout }, Paged(query.parser)),
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
