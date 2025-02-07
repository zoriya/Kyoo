import { useLayoutEffect, type ReactElement } from "react";
import { useSetError } from "~/providers/error-provider";
import { ErrorView } from "~/ui/errors";
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
	const [setError] = useSetError("fetch");

	useLayoutEffect(() => {
		if (isPaused) {
			setError({ key: "offline" });
		}
		if (error && (error.status === 401 || error.status === 403)) {
			setError({ key: "unauthorized", error });
		}
	}, [error, isPaused]);

	if (error) {
		return <ErrorView error={error} />;
	}
	if (!data) return <Loader />;
	return <Render {...data} />;
};
