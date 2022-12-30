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

import { ComponentType, ReactElement, ReactNode } from "react";
import {
	dehydrate,
	QueryClient,
	QueryFunctionContext,
	useInfiniteQuery,
	useQuery,
} from "@tanstack/react-query";
import { z } from "zod";
import { KyooErrors } from "./kyoo-errors";
import { Page, Paged } from "./page";
import { Platform } from "react-native";

const queryFn = async <Data,>(
	type: z.ZodType<Data>,
	context: QueryFunctionContext,
): Promise<Data> => {
	const kyooUrl =
		(Platform.OS !== "web"
			? process.env.PUBLIC_BACK_URL
			: typeof window === "undefined"
			? process.env.KYOO_URL ?? "http://localhost:5000"
				// TODO remove the hardcoded fallback. This is just for testing purposes
			: "/api") ?? "https://beta.sdg.moe";
	if (!kyooUrl) console.error("Kyoo's url is not defined.");

	let resp;
	try {
		resp = await fetch(
			[kyooUrl]
				.concat(
					context.pageParam ? [context.pageParam] : (context.queryKey.filter((x) => x) as string[]),
				)
				.join("/")
				.replace("/?", "?"),
		);
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
		console.log("Invalid response:", data);
		throw data as KyooErrors;
	}

	let data;
	try {
		data = await resp.json();
	} catch (e) {
		console.error("Invald json from kyoo", e);
		throw { errors: ["Invalid repsonse from kyoo"] };
	}
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
};

export type QueryPage<Props = {}> = ComponentType<Props> & {
	getFetchUrls?: (route: { [key: string]: string }) => QueryIdentifier[];
	getLayout?: ({ page }: { page: ReactElement }) => JSX.Element;
};

const toQueryKey = <Data,>(query: QueryIdentifier<Data>) => {
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
		queryFn: (ctx) => queryFn(query.parser, ctx),
	});
};

export const useInfiniteFetch = <Data,>(query: QueryIdentifier<Data>) => {
	const ret = useInfiniteQuery<Page<Data>, KyooErrors>({
		queryKey: toQueryKey(query),
		queryFn: (ctx) => queryFn(Paged(query.parser), ctx),
		getNextPageParam: (page: Page<Data>) => page?.next || undefined,
	});
	return { ...ret, items: ret.data?.pages.flatMap((x) => x.items) };
};

export const fetchQuery = async (queries: QueryIdentifier[]) => {
	// we can't put this check in a function because we want build time optimizations
	// see https://github.com/vercel/next.js/issues/5354 for details
	if (typeof window !== "undefined") return {};

	const client = createQueryClient();
	await Promise.all(
		queries.map((query) => {
			if (query.infinite) {
				return client.prefetchInfiniteQuery({
					queryKey: toQueryKey(query),
					queryFn: (ctx) => queryFn(Paged(query.parser), ctx),
				});
			} else {
				return client.prefetchQuery({
					queryKey: toQueryKey(query),
					queryFn: (ctx) => queryFn(query.parser, ctx),
				});
			}
		}),
	);
	return dehydrate(client);
};
