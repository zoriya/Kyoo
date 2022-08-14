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

import { ComponentType } from "react";
import {
	dehydrate,
	QueryClient,
	QueryFunctionContext,
	useInfiniteQuery,
	useQuery,
} from "react-query";
import { z } from "zod";
import { KyooErrors, Page } from "~/models";
import { Paged } from "~/models/page";

const queryFn = async <Data>(
	type: z.ZodType<Data>,
	context: QueryFunctionContext,
): Promise<Data> => {
	try {
		const resp = await fetch(
			[typeof window === "undefined" ? process.env.KYOO_URL : "/api"]
				.concat(
					context.pageParam ? [context.pageParam] : (context.queryKey.filter((x) => x) as string[]),
				)
				.join("/")
				.replace("/?", "?"),
		);
		if (!resp.ok) {
			throw await resp.json();
		}

		const data = await resp.json();
		const parsed = await type.safeParseAsync(data);
		if (!parsed.success) {
			console.log("Parse error: ", parsed.error);
			throw { errors: parsed.error.errors.map((x) => x.message) } as KyooErrors;
		}
		return parsed.data;
	} catch (e) {
		console.error("Fetch error: ", e);
		throw { errors: ["Could not reach Kyoo's server."] } as KyooErrors;
	}
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
	parser: z.ZodType<T>;
	path: string[];
	params?: { [query: string]: boolean | number | string | string[] };
};

export type QueryPage<Props = {}> = ComponentType<Props> & {
	getFetchUrls?: (route: { [key: string]: string }) => QueryIdentifier[];
};

const toQuery = (params?: { [query: string]: boolean | number | string | string[] }) => {
	if (!params) return undefined;
	return (
		"?" +
		Object.entries(params)
			.map(([k, v]) => `${k}=${Array.isArray(v) ? v.join(",") : v}`)
			.join("&")
	);
};

export const useFetch = <Data>(query: QueryIdentifier<Data>) => {
	return useQuery<Data, KyooErrors>({
		queryKey: [...query.path, toQuery(query.params)],
		queryFn: (ctx) => queryFn(query.parser, ctx),
	});
};

export const useInfiniteFetch = <Data>(query: QueryIdentifier<Data>) => {
	return useInfiniteQuery<Page<Data>, KyooErrors>({
		queryKey: [...query.path, toQuery(query.params)],
		queryFn: (ctx) => queryFn(Paged(query.parser), ctx),
	});
};

export const fetchQuery = async (queries: QueryIdentifier[]) => {
	// we can't put this check in a function because we want build time optimizations
	// see https://github.com/vercel/next.js/issues/5354 for details
	if (typeof window !== "undefined") return {};

	const client = createQueryClient();
	await Promise.all(
		queries.map((query) =>
			client.prefetchQuery({
				queryKey: [...query.path, toQuery(query.params)],
				queryFn: (ctx) => queryFn(query.parser, ctx),
			}),
		),
	);
	return dehydrate(client);
};
