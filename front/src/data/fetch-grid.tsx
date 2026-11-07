import { type ComponentProps, type ReactElement, Suspense } from "react";
import { useBreakpointMap } from "~/primitives";
import { GridView } from "~/query/fetch-grid";
import { type QueryIdentifier, useInfiniteFetch } from "./query";

export type { GridLayout } from "~/query/fetch-grid";

const InnerGrid = <Data,>({
	query,
	...props
}: Omit<ComponentProps<typeof GridView<Data>>, "source"> & {
	query: QueryIdentifier<Data>;
}): ReactElement | null => {
	const { numColumns, numLines } = useBreakpointMap(props.layout);
	const limit = numColumns * numLines;
	const { items, fetchNextPage, hasNextPage, isFetching } = useInfiniteFetch({
		...query,
		params: { ...query.params, limit },
	});

	// the store keeps the pages as one list, cut it back to pages of `limit`
	return (
		<GridView
			source={{
				pages: Array.from({ length: Math.ceil(items.length / limit) }, (_, i) =>
					items.slice(i * limit, (i + 1) * limit),
				),
				fetchNextPage,
				hasNextPage,
				isFetching: false,
				isFetchingNextPage: isFetching,
			}}
			{...props}
		/>
	);
};

export const InfiniteGrid = <Data,>({
	query,
	...props
}: ComponentProps<typeof InnerGrid<Data>>): ReactElement | null => {
	if (!query.infinite)
		console.warn("A non infinite query was passed to an InfiniteGrid.");

	return (
		<Suspense
			fallback={
				<GridView
					source={{
						pages: [],
						fetchNextPage: async () => false,
						hasNextPage: false,
						isFetching: true,
						isFetchingNextPage: false,
					}}
					{...props}
				/>
			}
		>
			<InnerGrid
				// a new query starts back on its first page
				key={JSON.stringify([query.path, query.params])}
				query={query}
				{...props}
			/>
		</Suspense>
	);
};
