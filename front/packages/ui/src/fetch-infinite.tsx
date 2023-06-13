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
import { useBreakpointMap, HR } from "@kyoo/primitives";
import { FlashList } from "@shopify/flash-list";
import { ComponentType, isValidElement, ReactElement, useRef } from "react";
import { EmptyView, ErrorView, Layout, WithLoading } from "./fetch";

export const InfiniteFetch = <Data, Props>({
	query,
	placeholderCount = 15,
	incremental = false,
	horizontal = false,
	children,
	layout,
	empty,
	divider = false,
	Header,
	headerProps,
	...props
}: {
	query: QueryIdentifier<Data>;
	placeholderCount?: number;
	layout: Layout;
	horizontal?: boolean;
	children: (
		item: Data extends Page<infer Item> ? WithLoading<Item> : WithLoading<Data>,
		i: number,
	) => ReactElement | null;
	empty?: string | JSX.Element;
	incremental?: boolean;
	divider?: boolean | ComponentType;
	Header?: ComponentType<Props & { children: JSX.Element }> | ReactElement;
	headerProps?: Props
}): JSX.Element | null => {
	if (!query.infinite) console.warn("A non infinite query was passed to an InfiniteFetch.");

	const { numColumns, size } = useBreakpointMap(layout);
	const oldItems = useRef<Data[] | undefined>();
	let { items, error, fetchNextPage, hasNextPage, refetch, isRefetching } = useInfiniteFetch(
		query,
		{
			useErrorBoundary: false,
		},
	);
	if (incremental && items) oldItems.current = items;

	if (error) return <ErrorView error={error} />;
	if (empty && items && items.length === 0) {
		if (typeof empty !== "string") return empty;
		return <EmptyView message={empty} />;
	}

	if (incremental)
		items ??= oldItems.current;
	const count = items ? numColumns - (items.length % numColumns) : placeholderCount;
	const placeholders = [...Array(count === 0 ? numColumns : count)].map(
		(_, i) => ({ id: `gen${i}`, isLoading: true } as Data),
	);

	// @ts-ignore
	if (headerProps && !isValidElement(Header)) Header = <Header {...headerProps} />
	return (
		<FlashList
			renderItem={({ item, index }) => children({ isLoading: false, ...item } as any, index)}
			data={hasNextPage !== false ? [...(items || []), ...placeholders] : items}
			horizontal={horizontal}
			keyExtractor={(item: any) => item.id?.toString()}
			numColumns={numColumns}
			estimatedItemSize={size}
			onEndReached={fetchNextPage}
			onEndReachedThreshold={0.5}
			onRefresh={refetch}
			refreshing={isRefetching}
			ItemSeparatorComponent={divider === true ? HR : divider || null}
			ListHeaderComponent={Header}
			{...props}
		/>
	);
};
