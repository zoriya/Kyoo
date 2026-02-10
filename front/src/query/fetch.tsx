import type { ReactElement } from "react";
import { type QueryIdentifier, useFetch } from "./query";

export const Fetch = <Data,>({
	query,
	Render,
	Loader,
}: {
	query: QueryIdentifier<Data>;
	Render: (item: Data) => ReactElement | null;
	Loader: () => ReactElement | null;
}): JSX.Element | null => {
	const { data } = useFetch(query);

	if (!data) return <Loader />;
	return <Render {...data} />;
};
