import type {
	LegendListComponent,
	LegendListProps,
} from "@legendapp/list/react-native";
import { LegendList } from "@legendapp/list/react-native";
import {
	type ComponentType,
	type ReactElement,
    useLayoutEffect,
	useMemo,
	useState,
} from "react";
import type { ViewStyle } from "react-native";
import { createAnimatedComponent } from "react-native-reanimated";
import { type Breakpoint, HR, useBreakpointMap } from "~/primitives";
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
		items: fetched,
		fetchNextPage,
		hasNextPage,
		isFetching,
		refetch,
		isRefetching,
	} = useInfiniteFetch(query);

	// keep previous items instead of flashing skeletons with `incremental`
	const [retained, setRetained] = useState<Data[] | undefined>(undefined);
	useLayoutEffect(() => {
		if (incremental && fetched) setRetained(fetched);
	}, [incremental, fetched]);
	const items = incremental ? (fetched ?? retained) : fetched;

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
