import type {
	LegendListComponent,
	LegendListProps,
} from "@legendapp/list/react-native";
import { LegendList } from "@legendapp/list/react-native";
import { keepPreviousData } from "@tanstack/react-query";
import { type ComponentType, type ReactElement, useMemo } from "react";
import type { ViewStyle } from "react-native";
import { createAnimatedComponent } from "react-native-reanimated";
import {
	type Breakpoint,
	FocusGroup,
	HR,
	useBreakpointMap,
} from "~/primitives";
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
				// columnGap to LegendList, so margins set there are dropped). A row keeps
				// it too so its first card is not flush against the screen edge (or the
				// nav rail on a tv) and its focus ring has room to be drawn.
				paddingHorizontal: gap,
				...contentContainerStyle,
			}}
			columnWrapperStyle={{
				gap,
				...columnWrapperStyle,
			}}
			// A scroll view is a focus target on a tv, and it takes its focusability
			// from whether it scrolls rather than from `focusable`. An empty row has
			// nothing to scroll and nothing to hand the focus to, so it must not catch
			// a dpad press on the way past.
			focusable={false}
			scrollEnabled={layout.layout !== "horizontal" || !!items?.length}
			{...props}
		/>
	);

	// A row is a focus group of its own: coming back to it from another row lands
	// on the card the user left it on, rather than on whatever the focus finder
	// decides is geometrically closest. Its right edge is a wall for the same
	// reason — left stays open so it still leads to the nav rail.
	// An empty row (or one still loading its placeholders) has nothing to hand the
	// focus to, and a guide adds itself to the candidates whatever `focusable`
	// says — so it is left out entirely rather than left there to dead-end on.
	if (layout.layout === "horizontal")
		return items?.length ? (
			// `focusable` matters even though the group is never selected itself: with
			// `autoFocus` it stands in for its children in the focus search, and the
			// finder skips a candidate that says it cannot be focused — the row would
			// be invisible to a dpad coming down the page.
			<FocusGroup autoFocus trapFocusRight focusable>
				{list}
			</FocusGroup>
		) : (
			list
		);
	return list;
};
