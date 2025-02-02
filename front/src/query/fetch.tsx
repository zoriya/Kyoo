import type { ReactElement } from "react";
import { ErrorView, OfflineView } from "~/ui/errors";
import { type QueryIdentifier, useFetch } from "./query";

export const Fetch = <Data,>({
	query,
	Render,
	Loader,
}: {
	query: QueryIdentifier<Data>;
	Render: (item: Data) => ReactElement;
	Loader: () => ReactElement;
}): JSX.Element | null => {
	const { data, isPaused, error } = useFetch(query);

	if (error) return <ErrorView error={error} />;
	if (isPaused) return <OfflineView />;
	if (!data) return <Loader />;
	return <Render {...data} />;
};
