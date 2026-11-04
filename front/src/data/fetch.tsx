import { type ComponentProps, type ReactElement, Suspense } from "react";
import { InfiniteView } from "~/query/fetch-infinite";
import { type QueryIdentifier, useFetch, useInfiniteFetch } from "./query";

const Inner = <Data,>({
	query,
	Render,
}: {
	query: QueryIdentifier<Data>;
	Render: (item: Data) => ReactElement | null;
}): ReactElement | null => {
	const data = useFetch(query);
	return Render(data);
};

export const Fetch = <Data,>({
	Loader,
	...props
}: ComponentProps<typeof Inner<Data>> & {
	Loader: () => ReactElement | null;
}): ReactElement | null => {
	return (
		<Suspense fallback={<Loader />}>
			<Inner {...props} />
		</Suspense>
	);
};

const InnerList = <Data, Type extends string = string>({
	query,
	...props
}: Omit<ComponentProps<typeof InfiniteView<Data, Type>>, "source"> & {
	query: QueryIdentifier<Data>;
}): ReactElement | null => {
	const source = useInfiniteFetch(query);
	return <InfiniteView source={source} {...props} />;
};

export const InfiniteFetch = <Data, Type extends string = string>({
	query,
	...props
}: ComponentProps<typeof InnerList<Data, Type>>): ReactElement | null => {
	if (!query.infinite)
		console.warn("A non infinite query was passed to an InfiniteFetch.");

	return (
		<Suspense
			fallback={
				<InfiniteView
					source={{
						fetchNextPage: () => false,
						hasNextPage: false,
						isFetching: true,
						refetch: () => {},
						isRefetching: false,
					}}
					{...props}
				/>
			}
		>
			<InnerList query={query} {...props} />
		</Suspense>
	);
};
