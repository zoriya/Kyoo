import { type ReactElement, Suspense, useDeferredValue } from "react";
import { type QueryIdentifier, useInfiniteFetch } from "~/data";

const LoadedComboBoxItems = <Data,>({
	query,
	search,
	placeholderCount,
	children,
}: {
	query: (search: string) => QueryIdentifier<Data>;
	search: string;
	placeholderCount: number;
	children: (
		items: (Data | null)[],
		onEndReached: (() => void) | undefined,
	) => ReactElement;
}) => {
	const listSearch = useDeferredValue(search);
	const { items, fetchNextPage, hasNextPage, isFetching } = useInfiniteFetch({
		...query(listSearch),
		cancelPrevious: true,
	});
	return children(
		isFetching || search !== listSearch
			? [...items, ...Array<null>(placeholderCount).fill(null)]
			: items,
		hasNextPage && !isFetching ? () => fetchNextPage() : undefined,
	);
};

export const ComboBoxItems = <Data,>(
	props: Parameters<typeof LoadedComboBoxItems<Data>>[0],
) => {
	return (
		<Suspense
			fallback={props.children(
				Array<null>(props.placeholderCount).fill(null),
				undefined,
			)}
		>
			<LoadedComboBoxItems {...props} />
		</Suspense>
	);
};
