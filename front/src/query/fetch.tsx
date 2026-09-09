import {
	type Context,
	type InferResultType,
	type InitialQueryBuilder,
	type QueryBuilder,
	useDbClient,
	useLiveQuery,
} from "@tanstack/react-db";
import type { ReactElement } from "react";
import { lastLoadError, refetchAll, toRenderableError } from "~/db";
import { useToken } from "~/providers/account-context";
import { type QueryIdentifier, useFetch } from "./query";

export const Fetch = <Data,>({
	query,
	Render,
	Loader,
}: {
	query: QueryIdentifier<Data>;
	Render: (item: Data) => ReactElement | null;
	Loader: () => ReactElement | null;
}): ReactElement | null => {
	const { data } = useFetch(query);

	if (!data) return <Loader />;
	return Render(data);
};

/**
 * `Fetch` for the local db: renders a single-result live query
 * (`.findOne()`), lazily fetching it from the api if it is not local yet.
 */
export const Live = <TContext extends Context>({
	query,
	Render,
	Loader,
}: {
	query: (q: InitialQueryBuilder) => QueryBuilder<TContext>;
	Render: (item: NonNullable<InferResultType<TContext>>) => ReactElement | null;
	Loader: () => ReactElement | null;
}): ReactElement | null => {
	const client = useDbClient();
	const { authToken } = useToken();
	const { data, isError, collection } = useLiveQuery(query);

	if (data) return Render(data as NonNullable<InferResultType<TContext>>);
	if (isError)
		throw toRenderableError(lastLoadError(collection), authToken, () =>
			refetchAll(client),
		);
	return <Loader />;
};
