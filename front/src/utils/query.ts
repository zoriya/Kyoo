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
import { dehydrate, QueryClient, QueryFunctionContext, useQuery } from "react-query";

const isServer = () => typeof window === "undefined"

const queryFn = async <T>(context: QueryFunctionContext): Promise<T> => {
	try {
		const resp = await fetch(
			[isServer() ? process.env.KYOO_URL : "/api"]
				.concat(context.pageParam ? [context.pageParam] : (context.queryKey as string[]))
				.join("/"),
		);
		if (!resp.ok) {
			throw await resp.json();
		}
		return await resp.json();
	} catch (e) {
		console.error(e);
		throw { errors: ["Could not reach Kyoo's server."] }; // as KyooErrors;
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
				queryFn: queryFn,
			},
		},
	});

export type QueryPage<Props = {}> = ComponentType<Props> & {
	getFetchUrls?: (route: { [key: string]: string }) => [[string]];
};

export const useFetch = <Data>(...params: [string]) => {
	return useQuery<Data, any>(params);
};

export const fetchQuery = async (queries: [[string]]) => {
	if (!isServer()) return {};

	const client = createQueryClient();
	await Promise.all(queries.map((x) => client.prefetchQuery(x)));
	return dehydrate(client);
};
