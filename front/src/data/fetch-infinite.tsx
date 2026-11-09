import type {
	LegendListComponent,
	LegendListProps,
} from "@legendapp/list/react-native";
import { LegendList } from "@legendapp/list/react-native";
import { type ComponentType, type ReactElement, useMemo } from "react";
import type { ViewStyle } from "react-native";
import { createAnimatedComponent } from "react-native-reanimated";
import {
	type Breakpoint,
	FocusGroup,
	HR,
	useBreakpointMap,
} from "~/primitives";

const AnimatedLegendList = createAnimatedComponent(
	LegendList,
) as LegendListComponent;

export type Layout = {
	numColumns: Breakpoint<number>;
	size: Breakpoint<number>;
	gap: Breakpoint<number>;
	layout: "grid" | "horizontal" | "vertical";
};

export const InfiniteView = <Data, Type extends string = string>({
	source: {
		items,
		fetchNextPage,
		hasNextPage,
		isFetching,
		refetch,
		isRefetching,
	},
	placeholderCount = 4,
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
	source: {
		items?: Data[];
		fetchNextPage: () => unknown;
		hasNextPage: boolean;
		isFetching: boolean;
		refetch: () => unknown;
		isRefetching: boolean;
	};
	placeholderCount?: number;
	layout: Layout;
	horizontal?: boolean;
	getKey?: (item: Data, index: number) => string;
	getItemType?: (item: Data, index: number) => Type;
	getStickyIndices?: (items: Data[]) => number[];
	stickyHeaderConfig?: LegendListProps["stickyHeaderConfig"];
	snapToAlignment?: LegendListProps["snapToAlignment"];
	drawDistance?: LegendListProps["drawDistance"];
	Render: (props: { item: Data; index: number }) => ReactElement | null;
	Loader: (props: { index: number }) => ReactElement | null;
	Empty?: ReactElement;
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

	const data = useMemo(() => {
		const count = items
			? numColumns - (items.length % numColumns)
			: placeholderCount;
		const placeholders = [...Array(count === 0 ? numColumns : count)].fill(0);
		if (!items) return placeholders;
		return isFetching && !isRefetching ? [...items, ...placeholders] : items;
	}, [items, isFetching, isRefetching, placeholderCount, numColumns]);

	const list = (
		<AnimatedLegendList
			data={data}
			recycleItems
			getItemType={getItemType}
			estimatedItemSize={size}
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
			refreshing={isRefetching}
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
				paddingHorizontal: gap,
				...contentContainerStyle,
			}}
			columnWrapperStyle={{
				gap,
				...columnWrapperStyle,
			}}
			focusable={false}
			scrollEnabled={layout.layout !== "horizontal" || !!items?.length}
			{...props}
		/>
	);

	// A row is a focus group of its own: coming back to it from another row lands
	// on the card the user left it on, rather than on whatever the focus finder
	// decides is geometrically closest.
	if (layout.layout === "horizontal")
		return items?.length ? (
			<FocusGroup autoFocus trapFocusRight focusable>
				{list}
			</FocusGroup>
		) : (
			list
		);
	return list;
};
