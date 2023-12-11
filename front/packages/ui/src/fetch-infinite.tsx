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
import { ComponentProps, ComponentType, isValidElement, ReactElement, useRef } from "react";
import { EmptyView, ErrorView, Layout, WithLoading, addHeader } from "./fetch";
import { View, DimensionValue } from "react-native";

export const InfiniteFetchList = <Data, Props, _>({
	query,
	placeholderCount = 2,
	incremental = false,
	children,
	layout,
	empty,
	divider = false,
	Header,
	headerProps,
	getItemType,
	fetchMore = true,
	...props
}: {
	query: ReturnType<typeof useInfiniteFetch<_, Data>>;
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
	headerProps?: Props;
	getItemType?: (item: WithLoading<Data>, index: number) => string | number;
	fetchMore?: boolean;
}): JSX.Element | null => {
	const { numColumns, size, gap } = useBreakpointMap(layout);
	const oldItems = useRef<Data[] | undefined>();
	let { items, error, fetchNextPage, hasNextPage, isFetching, refetch, isRefetching } = query;
	if (incremental && items) oldItems.current = items;

	if (error) return <ErrorView error={error} />;
	if (empty && items && items.length === 0) {
		if (typeof empty !== "string") return addHeader(Header, empty, headerProps);
		return addHeader(Header, <EmptyView message={empty} />, headerProps);
	}

	if (incremental) items ??= oldItems.current;
	const count = items ? numColumns - (items.length % numColumns) : placeholderCount;
	const placeholders = [...Array(count === 0 ? numColumns : count)].map(
		(_, i) => ({ id: `gen${i}`, isLoading: true }) as Data,
	);

	// @ts-ignore
	if (headerProps && !isValidElement(Header)) Header = <Header {...headerProps} />;
	return (
		<FlashList
			contentContainerStyle={{
				paddingHorizontal: layout.layout !== "vertical" ? gap / 2 : 0,
			}}
			renderItem={({ item, index }) => (
				<View
					style={{
						paddingHorizontal: layout.layout !== "vertical" ? gap / 2 : 0,
						paddingVertical: layout.layout !== "horizontal" ? gap / 2 : 0,
					}}
				>
					{children({ isLoading: false, ...item } as any, index)}
				</View>
			)}
			data={isFetching ? [...(items || []), ...placeholders] : items}
			horizontal={layout.layout === "horizontal"}
			keyExtractor={(item: any) => item.id}
			numColumns={numColumns}
			estimatedItemSize={size}
			onEndReached={fetchMore ? fetchNextPage : undefined}
			onEndReachedThreshold={0.5}
			onRefresh={refetch}
			refreshing={isRefetching}
			ItemSeparatorComponent={divider === true ? HR : divider || null}
			ListHeaderComponent={Header}
			getItemType={getItemType}
			{...props}
		/>
	);
};

export const InfiniteFetch = <Data, Props, _>({
	query,
	...props
}: {
	query: QueryIdentifier<_, Data>;
} & Omit<ComponentProps<typeof InfiniteFetchList<Data, Props, _>>, "query">) => {
	if (!query.infinite) console.warn("A non infinite query was passed to an InfiniteFetch.");

	const ret = useInfiniteFetch(query);
	return <InfiniteFetchList query={ret} {...props} />;
};
