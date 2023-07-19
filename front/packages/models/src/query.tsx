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
	UseInfiniteQueryOptions,
	useQuery,
} from "@tanstack/react-query";
import { z } from "zod";
import { KyooErrors } from "./kyoo-errors";
import { Page, Paged } from "./page";
import { Platform } from "react-native";
import { getToken } from "./login";

const kyooUrl =
	Platform.OS !== "web"
		? process.env.PUBLIC_BACK_URL
		: typeof window === "undefined"
			? process.env.KYOO_URL ?? "http://localhost:5000"
			: "/api";

export let kyooApiUrl: string | null = kyooUrl || null;

export const setApiUrl = (apiUrl: string) => {
	kyooApiUrl = apiUrl;
}

export const queryFn = async <Data,>(
	context:
		| QueryFunctionContext
		| {
			path: (string | false | undefined | null)[];
			body?: object;
			method: "GET" | "POST" | "DELETE";
			authenticated?: boolean;
			apiUrl?: string;
			abortSignal?: AbortSignal;
		},
	type?: z.ZodType<Data>,
	token?: string | null,
): Promise<Data> => {
	// @ts-ignore
	let url: string | null = context.apiUrl ?? kyooApiUrl;
	if (!url) console.error("Kyoo's url is not defined.");
	kyooApiUrl = url;

	// @ts-ignore
	if (!token && context.authenticated !== false) token = await getToken();
	const path = [url]
		.concat(
			"path" in context
				? context.path.filter((x) => x)
				: context.pageParam
					? [context.pageParam]
					: (context.queryKey.filter((x, i) => x && i) as string[]),
		)
		.join("/")
		.replace("/?", "?");
	let resp;
	try {
		resp = await fetch(path, {
			// @ts-ignore
			method: context.method,
			// @ts-ignore
			body: context.body ? JSON.stringify(context.body) : undefined,
			headers: {
				...(token ? { Authorization: token } : {}),
				...("body" in context ? { "Content-Type": "application/json" } : {}),
			},
			signal: "abortSignal" in context ? context.abortSignal : undefined,
		});
	} catch (e) {
		console.log("Fetch error", e);
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
		console.log(`Invalid response (${"method" in context && context.method ? context.method : "GET"} ${path}):`, data, resp.status);
		throw data as KyooErrors;
	}

	// If the method is DELETE, 204 NoContent is returned from kyoo.
	// @ts-ignore
	if (context.method === "DELETE") return undefined;

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
		console.log("Parse error: ", parsed.error);
		throw { errors: parsed.error.errors.map((x) => x.message) } as KyooErrors;
	}
	return parsed.data;
};

export const createQueryClient = () =>
	new QueryClient({
		defaultOptions: {
			queries: {
				staleTime: Infinity,
				refetchOnWindowFocus: false,
				refetchOnReconnect: false,
				retry: false,
			},
		},
	});

export type QueryIdentifier<T = unknown> = {
	parser: z.ZodType<T, z.ZodTypeDef, any>;
	path: (string | undefined)[];
	params?: { [query: string]: boolean | number | string | string[] | undefined };
	infinite?: boolean;
	/**
	 * A custom get next function if the infinite query is not a page.
	 */
	getNext?: (item: unknown) => string | undefined;
};

export type QueryPage<Props = {}> = ComponentType<Props> & {
	getFetchUrls?: (route: { [key: string]: string }) => QueryIdentifier[];
	getLayout?:
		| ComponentType<{ page: ReactElement }>
		| { Layout: ComponentType<{ page: ReactElement }>; props: object };
};

const toQueryKey = <Data,>(query: QueryIdentifier<Data>) => {
	const prefix = Platform.OS !== "web" ? [kyooApiUrl] : [""];

	if (query.params) {
		return [
			...prefix,
			...query.path,
			"?" +
				Object.entries(query.params)
					.filter(([_, v]) => v !== undefined)
					.map(([k, v]) => `${k}=${Array.isArray(v) ? v.join(",") : v}`)
					.join("&"),
		];
	} else {
		return [...prefix, ...query.path];
	}
};

export const useFetch = <Data,>(query: QueryIdentifier<Data>) => {
	return useQuery<Data, KyooErrors>({
		queryKey: toQueryKey(query),
		queryFn: (ctx) => queryFn(ctx, query.parser),
	});
};

export const useInfiniteFetch = <Data,>(
	query: QueryIdentifier<Data>,
	options?: Partial<UseInfiniteQueryOptions<Data[], KyooErrors>>,
) => {
	if (query.getNext) {
		// eslint-disable-next-line react-hooks/rules-of-hooks
		const ret = useInfiniteQuery<Data[], KyooErrors>({
			queryKey: toQueryKey(query),
			queryFn: (ctx) => queryFn(ctx, z.array(query.parser)),
			getNextPageParam: query.getNext,
			...options,
		});
		return { ...ret, items: ret.data?.pages.flatMap((x) => x) };
	}
	// eslint-disable-next-line react-hooks/rules-of-hooks
	const ret = useInfiniteQuery<Page<Data>, KyooErrors>({
		queryKey: toQueryKey(query),
		queryFn: (ctx) => queryFn(ctx, Paged(query.parser)),
		getNextPageParam: (page: Page<Data>) => page?.next || undefined,
	});
	return { ...ret, items: ret.data?.pages.flatMap((x) => x.items) };
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
