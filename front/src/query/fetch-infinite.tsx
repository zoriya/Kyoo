import type {
	LegendListComponent,
	LegendListProps,
} from "@legendapp/list/react-native";
import { LegendList } from "@legendapp/list/react-native";
import { keepPreviousData } from "@tanstack/react-query";
import { type ComponentType, type ReactElement, useMemo } from "react";
import type { ViewStyle } from "react-native";
import { createAnimatedComponent } from "react-native-reanimated";
import { type Breakpoint, HR, uiScale, useBreakpointMap } from "~/primitives";
import { type QueryIdentifier, useInfiniteFetch } from "./query";

const AnimatedLegendList = createAnimatedComponent(
	LegendList,
) as LegendListComponent;

export type Layout = {
	numColumns: Breakpoint<number>;
	size: Breakpoint<number>;
	gap: Breakpoint<number>;
	layout: "grid" | "horizontal" | "vertical";
};

export const InfiniteFetch = <Data, Type extends string = string>({
	query,
	placeholderCount = 4,
	incremental = false,
	getKey,
	getItemType,
	getStickyIndices,
	Render,
	Loader,
	layout,
	Empty,
	Divider,
	Header,
	Footer,
	fetchMore = true,
	contentContainerStyle,
	columnWrapperStyle,
	...props
}: {
	query: QueryIdentifier<Data>;
	placeholderCount?: number;
	layout: Layout;
	horizontal?: boolean;
	getKey?: (item: Data, index: number) => string;
	getItemType?: (item: Data, index: number) => Type;
	getStickyIndices?: (items: Data[]) => number[];
	stickyHeaderConfig?: LegendListProps["stickyHeaderConfig"];
	drawDistance?: LegendListProps["drawDistance"];
	Render: (props: { item: Data; index: number }) => ReactElement | null;
	Loader: (props: { index: number }) => ReactElement | null;
	Empty?: ReactElement;
	incremental?: boolean;
	Divider?: true | ComponentType;
	Header?: ComponentType<{ children: ReactElement }> | ReactElement;
	Footer?: ComponentType<{ children: ReactElement }> | ReactElement;
	fetchMore?: boolean;
	style?: LegendListProps["style"];
	contentContainerStyle?: ViewStyle;
	onScroll?: LegendListProps["onScroll"];
	scrollEventThrottle?: LegendListProps["scrollEventThrottle"];
	columnWrapperStyle?: Omit<ViewStyle, "gap" | "rowGap" | "columnGap">;
}): ReactElement | null => {
	const { numColumns, size, gap } = useBreakpointMap(layout);
	const {
		items,
		fetchNextPage,
		hasNextPage,
		isFetching,
		refetch,
		isRefetching,
		isPlaceholderData,
	} = useInfiniteFetch(
		incremental ? { ...query, placeholderData: keepPreviousData } : query,
	);

	if (!query.infinite)
		console.warn("A non infinite query was passed to an InfiniteFetch.");

	const data = useMemo(() => {
		const count = items
			? numColumns - (items.length % numColumns)
			: placeholderCount;
		const placeholders = [...Array(count === 0 ? numColumns : count)].fill(0);
		if (!items) return placeholders;
		return isFetching && !isRefetching ? [...items, ...placeholders] : items;
	}, [items, isFetching, isRefetching, placeholderCount, numColumns]);

	return (
		<AnimatedLegendList
			data={data}
			recycleItems
			getItemType={getItemType}
			// `size` is a design-pixel guess like the classNames it mirrors, so it
			// has to go through the same scale to stay a useful estimate on tv.
			estimatedItemSize={size * uiScale}
			stickyHeaderIndices={getStickyIndices?.(items ?? [])}
			renderItem={({ item, index }) =>
				item ? <Render index={index} item={item} /> : <Loader index={index} />
			}
			keyExtractor={(item: any, index) => {
				if (!item) return index + 1;
				return getKey ? getKey(item, index) : item.id;
			}}
			horizontal={layout.layout === "horizontal"}
			numColumns={layout.layout === "horizontal" ? 1 : numColumns}
			onEndReached={
				fetchMore && hasNextPage && !isFetching
					? () => fetchNextPage()
					: undefined
			}
			onEndReachedThreshold={0.5}
			onRefresh={layout.layout !== "horizontal" ? refetch : undefined}
			// keepPreviousData reports a query-key change as isRefetching; exclude
			// that (isPlaceholderData) so the spinner only shows on pull-to-refresh.
			refreshing={isRefetching && !isPlaceholderData}
			ListHeaderComponent={Header}
			ListHeaderComponentStyle={
				// Cancel the content padding for the header so banners/headers stay
				// full-bleed while the items keep their outer margin.
				layout.layout === "horizontal" ? undefined : { marginHorizontal: -gap }
			}
			ListEmptyComponent={Empty}
			ListFooterComponent={Footer}
			ItemSeparatorComponent={
				Divider === true ? HR : (Divider as any) || undefined
			}
			showsHorizontalScrollIndicator={false}
			showsVerticalScrollIndicator={false}
			contentContainerStyle={{
				// Outer margin lives here (columnWrapperStyle only forwards gap/rowGap/
				// columnGap to LegendList, so margins set there are dropped)
				...(layout.layout === "horizontal" ? null : { paddingHorizontal: gap }),
				...contentContainerStyle,
			}}
			columnWrapperStyle={{
				gap,
				...columnWrapperStyle,
			}}
			{...props}
		/>
	);
};
