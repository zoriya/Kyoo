import type {
	LegendListComponent,
	LegendListProps,
} from "@legendapp/list/react-native";
import { LegendList } from "@legendapp/list/react-native";
import { keepPreviousData } from "@tanstack/react-query";
import {
	type ComponentType,
	type ReactElement,
	useCallback,
	useMemo,
	useState,
} from "react";
import type { ViewStyle } from "react-native";
import { createAnimatedComponent } from "react-native-reanimated";
import {
	type Breakpoint,
	FocusGroup,
	HR,
	useBreakpointMap,
} from "~/primitives";
import {
	type Context,
	type InferResultType,
	type InitialQueryBuilder,
	type QueryBuilder,
	useDbClient,
	useLiveInfiniteQuery,
} from "@tanstack/react-db";
import { lastLoadError, refetchAll, toRenderableError } from "~/db";
import { useToken } from "~/providers/account-context";
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

export type InfiniteViewProps<Data, Type extends string = string> = {
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
};

export type InfiniteSource<Data> = {
	/** `undefined` until the first page is known. */
	items?: Data[];
	fetchNextPage: () => unknown;
	hasNextPage: boolean;
	isFetching: boolean;
	refetch: () => unknown;
	isRefetching: boolean;
	isPlaceholderData?: boolean;
};

/**
 * Legacy path: a react-query infinite query. Screens rendering shows,
 * entries or seasons use `InfiniteList` (rendered from the local db) instead.
 */
export const InfiniteFetch = <Data, Type extends string = string>({
	query,
	incremental = false,
	...props
}: InfiniteViewProps<Data, Type> & {
	query: QueryIdentifier<Data>;
}): ReactElement | null => {
	const source = useInfiniteFetch(
		incremental ? { ...query, placeholderData: keepPreviousData } : query,
	);
	if (!query.infinite)
		console.warn("A non infinite query was passed to an InfiniteFetch.");
	return <InfiniteView source={source} incremental={incremental} {...props} />;
};

/**
 * A paginated list over the local db. `query` is a live query without
 * limit/offset (`.orderBy()` is required): it is windowed page by page and
 * the collection fetches what the window needs from the api.
 */
export const InfiniteList = <
	TContext extends Context,
	Data = InferResultType<TContext>[number],
	Type extends string = string,
>({
	query,
	pageSize = 30,
	transform,
	...props
}: InfiniteViewProps<Data, Type> & {
	query: (q: InitialQueryBuilder) => QueryBuilder<TContext>;
	pageSize?: number;
	/** Derive the rendered items from the rows (interleave headers...). */
	transform?: (rows: any[]) => Data[];
}): ReactElement | null => {
	const client = useDbClient();
	const { authToken } = useToken();
	const {
		data,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
		isReady,
		isError,
		error,
		collection,
	} = useLiveInfiniteQuery(query, { pageSize });

	const [isRefetching, setRefetching] = useState(false);
	const refetch = useCallback(async () => {
		setRefetching(true);
		try {
			await refetchAll(client);
		} finally {
			setRefetching(false);
		}
	}, [client]);

	const items = useMemo(
		() => (transform ? transform(data) : (data as unknown as Data[])),
		[data, transform],
	);
	if (isError && data.length === 0)
		throw toRenderableError(error ?? lastLoadError(collection), authToken, refetch);

	return (
		<InfiniteView
			source={{
				items: isReady || data.length ? items : undefined,
				// a failed page is reported through `isError`, keep the list rendered
				fetchNextPage: () => fetchNextPage().catch(() => {}),
				hasNextPage,
				isFetching: !isReady || isFetchingNextPage,
				refetch,
				isRefetching,
			}}
			{...props}
		/>
	);
};

export const InfiniteView = <Data, Type extends string = string>({
	source,
	placeholderCount = 4,
	incremental: _incremental = false,
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
}: InfiniteViewProps<Data, Type> & {
	source: InfiniteSource<Data>;
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
	} = source;

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
