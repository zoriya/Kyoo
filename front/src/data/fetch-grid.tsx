import ArrowBack from "@material-symbols/svg-400/rounded/arrow_back-fill.svg";
import ArrowForward from "@material-symbols/svg-400/rounded/arrow_forward-fill.svg";
import {
	type ComponentProps,
	type ComponentType,
	type ReactElement,
	Suspense,
	useState,
} from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import {
	type Breakpoint,
	IconButton,
	tooltip,
	useBreakpointMap,
} from "~/primitives";
import { type QueryIdentifier, useInfiniteFetch } from "./query";

export type GridLayout = {
	numColumns: Breakpoint<number>;
	numLines: Breakpoint<number>;
	gap: Breakpoint<number>;
};

export const GridView = <Data,>({
	source: { pages, fetchNextPage, hasNextPage, isFetching, isFetchingNextPage },
	layout,
	Render,
	Loader,
	Empty,
	Header,
	Footer,
	getItemKey,
}: {
	source: {
		pages: Data[][];
		fetchNextPage: () => Promise<boolean>;
		hasNextPage: boolean;
		isFetching: boolean;
		isFetchingNextPage: boolean;
	};
	layout: GridLayout;
	Render: (props: { item: Data; index: number }) => ReactElement | null;
	Loader: (props: { index: number }) => ReactElement | null;
	Empty?: ReactElement;
	Header?: ComponentType<{ controls: ReactElement }> | ReactElement;
	Footer?: ComponentType | ReactElement;
	getItemKey?: (item: Data, index: number) => string | number;
}): ReactElement | null => {
	const { t } = useTranslation();
	const [pageIndex, setPageIndex] = useState(0);
	const { numColumns, gap } = useBreakpointMap(layout);

	const items = pages[pageIndex] ?? [];

	const controls = (
		<View className="flex-row items-center">
			<IconButton
				icon={ArrowBack}
				onPress={() => setPageIndex((x) => x - 1)}
				disabled={pageIndex <= 0}
				{...tooltip(t("misc.prev-page"))}
			/>
			<IconButton
				icon={ArrowForward}
				onPress={async () => {
					if (pageIndex < pages.length - 1) {
						setPageIndex((x) => x + 1);
						return;
					}
					if (!hasNextPage || isFetchingNextPage) return;
					if (await fetchNextPage()) setPageIndex((x) => x + 1);
				}}
				disabled={
					pageIndex === pages.length - 1 && (isFetchingNextPage || !hasNextPage)
				}
				{...tooltip(t("misc.next-page"))}
			/>
		</View>
	);

	const header =
		typeof Header === "function" ? (
			<Header controls={controls} />
		) : (
			(Header ?? controls)
		);

	const footer = typeof Footer === "function" ? <Footer /> : (Footer ?? null);

	if (isFetching && pages.length === 0) {
		return (
			<>
				{header}
				<View className="flex-row" style={{ gap }}>
					{[...Array(numColumns)].map((_, columnIndex) => (
						<View key={columnIndex} className="flex-1" style={{ gap }}>
							{[...Array(numColumns)].map((__, idx) => (
								<Loader key={idx} index={idx} />
							))}
						</View>
					))}
				</View>
				{footer}
			</>
		);
	}

	if (items.length === 0) {
		return (
			<>
				{header}
				{Empty}
				{footer}
			</>
		);
	}

	const columns = items.reduce(
		(acc, item, index) => {
			acc[index % numColumns].push(item);
			return acc;
		},
		[...Array(numColumns)].map(() => [] as Data[]),
	);

	return (
		<>
			{header}
			{
				<View className="flex-row" style={{ gap }}>
					{columns.map((column, columnIndex) => (
						<View key={columnIndex} className="flex-1" style={{ gap }}>
							{column.map((item, index) => {
								const itemIndex = index * numColumns + columnIndex;
								return (
									<Render
										key={
											getItemKey
												? getItemKey(item, itemIndex)
												: (item as any).id
										}
										item={item}
										index={itemIndex}
									/>
								);
							})}
						</View>
					))}
				</View>
			}
			{footer}
		</>
	);
};

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
