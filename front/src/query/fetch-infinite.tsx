import { LegendList } from "@legendapp/list";
import { type ComponentType, type ReactElement, useRef } from "react";
import type { ViewStyle } from "react-native";
import { type Breakpoint, HR, useBreakpointMap } from "~/primitives";
import { useSetError } from "~/providers/error-provider";
import { ErrorView } from "~/ui/errors";
import { type QueryIdentifier, useInfiniteFetch } from "./query";

export type Layout = {
	numColumns: Breakpoint<number>;
	size: Breakpoint<number>;
	gap: Breakpoint<number>;
	layout: "grid" | "horizontal" | "vertical";
};

export const InfiniteFetch = <Data, Type extends string = string>({
	query,
	placeholderCount = 2,
	incremental = false,
	getItemType,
	getItemSizeMult,
	getStickyIndices,
	Render,
	Loader,
	layout,
	Empty,
	Divider,
	Header,
	fetchMore = true,
	contentContainerStyle,
	...props
}: {
	query: QueryIdentifier<Data>;
	placeholderCount?: number;
	layout: Layout;
	horizontal?: boolean;
	getItemType?: (item: Data, index: number) => Type;
	getItemSizeMult?: (item: Data, index: number, type: Type) => number;
	getStickyIndices?: (items: Data[]) => number[];
	Render: (props: { item: Data; index: number }) => ReactElement | null;
	Loader: (props: { index: number }) => ReactElement | null;
	Empty?: JSX.Element;
	incremental?: boolean;
	Divider?: true | ComponentType;
	Header?: ComponentType<{ children: JSX.Element }> | ReactElement;
	fetchMore?: boolean;
	contentContainerStyle?: ViewStyle;
}): JSX.Element | null => {
	const { numColumns, size, gap } = useBreakpointMap(layout);
	const [setOffline, clearOffline] = useSetError("offline");
	const oldItems = useRef<Data[] | undefined>(undefined);
	let {
		items,
		isPaused,
		error,
		fetchNextPage,
		isFetching,
		refetch,
		isRefetching,
	} = useInfiniteFetch(query);
	if (incremental && items) oldItems.current = items;
	if (incremental) items ??= oldItems.current;

	if (!query.infinite)
		console.warn("A non infinite query was passed to an InfiniteFetch.");

	if (isPaused) setOffline();
	else clearOffline();

	if (error) return <ErrorView error={error} />;

	const count = items
		? numColumns - (items.length % numColumns)
		: placeholderCount;
	const placeholders = [...Array(count === 0 ? numColumns : count)].fill(0);
	const data =
		isFetching || !items ? [...(items || []), ...placeholders] : items;

	return (
		<LegendList
			data={data}
			recycleItems
			getItemType={getItemType}
			estimatedItemSize={getItemSizeMult ? undefined : size}
			stickyIndices={getStickyIndices?.(items ?? [])}
			getEstimatedItemSize={
				getItemSizeMult
					? (idx, item, type) => getItemSizeMult(item, idx, type as Type) * size
					: undefined
			}
			renderItem={({ item, index }) =>
				item ? <Render index={index} item={item} /> : <Loader index={index} />
			}
			keyExtractor={(item: any, index) => (item ? item.id : index + 1)}
			horizontal={layout.layout === "horizontal"}
			numColumns={layout.layout === "horizontal" ? 1 : numColumns}
			onEndReached={fetchMore ? () => fetchNextPage() : undefined}
			onEndReachedThreshold={0.5}
			onRefresh={layout.layout !== "horizontal" ? refetch : undefined}
			refreshing={isRefetching}
			ListHeaderComponent={Header}
			ItemSeparatorComponent={
				Divider === true ? HR : (Divider as any) || undefined
			}
			ListEmptyComponent={Empty}
			contentContainerStyle={{
				...contentContainerStyle,
				gap,
				marginHorizontal: gap,
			}}
			{...props}
		/>
	);
};
