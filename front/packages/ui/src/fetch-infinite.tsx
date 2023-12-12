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
import { ContentStyle, FlashList } from "@shopify/flash-list";
import { ComponentProps, ComponentType, isValidElement, ReactElement, useRef } from "react";
import { EmptyView, ErrorView, Layout, WithLoading, addHeader } from "./fetch";
import { FlatList, View, ViewStyle } from "react-native";

const emulateGap = (
	layout: "grid" | "vertical" | "horizontal",
	gap: number,
	numColumns: number,
	index: number,
): ViewStyle => {
	let marginLeft = 0;
	let marginRight = 0;

	if (layout !== "vertical" && numColumns > 1) {
		if (index % numColumns === 0) {
			marginRight = (gap * 2) / 3;
		} else if ((index + 1) % numColumns === 0) {
			marginLeft = (gap * 2) / 3;
		} else {
			marginLeft = gap / 3;
			marginRight = gap / 3;
		}
	}

	return {
		marginLeft,
		marginRight,
		marginTop: layout !== "horizontal" && index >= numColumns ? gap : 0,
	};
};

export const InfiniteFetchList = <Data, Props, _, Kind>({
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
	getItemSize,
	fetchMore = true,
	nested = false,
	contentContainerStyle,
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
	getItemType?: (item: WithLoading<Data>, index: number) => Kind;
	getItemSize?: (kind: Kind) => number;
	fetchMore?: boolean;
	nested?: boolean;
	contentContainerStyle?: ContentStyle;
}): JSX.Element | null => {
	const { numColumns, size, gap } = useBreakpointMap(layout);
	const oldItems = useRef<Data[] | undefined>();
	let { items, error, fetchNextPage, isFetching, refetch, isRefetching } = query;
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

	const List = nested ? (FlatList as unknown as typeof FlashList) : FlashList;

	// @ts-ignore
	if (headerProps && !isValidElement(Header)) Header = <Header {...headerProps} />;
	return (
		<List
			contentContainerStyle={{
				paddingHorizontal: layout.layout !== "vertical" ? gap : 0,
				...contentContainerStyle,
			}}
			renderItem={({ item, index }) => (
				<View
					style={[
						emulateGap(layout.layout, gap, numColumns, index),
						layout.layout === "horizontal" && {
							width:
								size * (getItemType && getItemSize ? getItemSize(getItemType(item, index)) : 1),
						},
					]}
				>
					{children({ isLoading: false, ...item } as any, index)}
				</View>
			)}
			data={isFetching ? [...(items || []), ...placeholders] : items}
			horizontal={layout.layout === "horizontal"}
			keyExtractor={(item: any) => item.id}
			numColumns={layout.layout === "horizontal" ? 1 : numColumns}
			estimatedItemSize={size}
			onEndReached={fetchMore ? fetchNextPage : undefined}
			onEndReachedThreshold={0.5}
			onRefresh={refetch}
			refreshing={isRefetching}
			ItemSeparatorComponent={divider === true ? HR : divider || null}
			ListHeaderComponent={Header}
			getItemType={getItemType}
			nestedScrollEnabled={nested}
			scrollEnabled={!nested}
			{...props}
		/>
	);
};

export const InfiniteFetch = <Data, Props, _, Kind>({
	query,
	...props
}: {
	query: QueryIdentifier<_, Data>;
} & Omit<ComponentProps<typeof InfiniteFetchList<Data, Props, _, Kind>>, "query">) => {
	if (!query.infinite) console.warn("A non infinite query was passed to an InfiniteFetch.");

	const ret = useInfiniteFetch(query);
	return <InfiniteFetchList query={ret} {...props} />;
};
