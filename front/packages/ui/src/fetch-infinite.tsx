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

import { Page, QueryIdentifier, useInfiniteFetch } from "@kyoo/models";
import { useBreakpointMap } from "@kyoo/primitives";
import { FlashList } from "@shopify/flash-list";
import { ReactElement } from "react";
import { ErrorView, Layout, WithLoading } from "./fetch";

export const InfiniteFetch = <Data,>({
	query,
	placeholderCount = 15,
	horizontal = false,
	children,
	layout,
	...props
}: {
	query: QueryIdentifier<Data>;
	placeholderCount?: number;
	layout: Layout;
	horizontal?: boolean;
	children: (
		item: Data extends Page<infer Item> ? WithLoading<Item> : WithLoading<Data>,
		key: string | undefined,
		i: number,
	) => ReactElement | null;
}): JSX.Element | null => {
	if (!query.infinite) console.warn("A non infinite query was passed to an InfiniteFetch.");

	const { numColumns, size } = useBreakpointMap(layout);
	const { items, error, fetchNextPage, hasNextPage, refetch, isRefetching } =
		useInfiniteFetch(query);

	if (error) return <ErrorView error={error} />;

	return (
		<FlashList
			renderItem={({ item, index }) =>
				children({ isLoading: false, ...item } as any, undefined, index)
			}
			data={
				hasNextPage
					? [
							...(items || []),
							...[
								...Array(
									items ? numColumns - (items.length % numColumns) + numColumns : placeholderCount,
								),
							].map((_, i) => ({ id: `gen${i}`, isLoading: true } as Data)),
					  ]
					: items
			}
			horizontal={horizontal}
			keyExtractor={(item: any) => item.id?.toString()}
			numColumns={numColumns}
			estimatedItemSize={size}
			onEndReached={fetchNextPage}
			onEndReachedThreshold={0.5}
			onRefresh={refetch}
			refreshing={isRefetching}
			{...props}
		/>
	);
};
