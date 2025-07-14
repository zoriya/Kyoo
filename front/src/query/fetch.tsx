import { type ReactElement, useLayoutEffect } from "react";
import { useSetError } from "~/providers/error-provider";
import { ErrorView } from "~/ui/errors/error";
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
	const { data, isPaused, error } = useFetch(query);
	const [setError] = useSetError("fetch");

	useLayoutEffect(() => {
		if (isPaused) {
			setError({ key: "offline" });
		}
		if (error && (error.status === 401 || error.status === 403)) {
			setError({ key: "unauthorized", error });
		}
	}, [error, isPaused, setError]);

	if (error) {
		return <ErrorView error={error} />;
	}
	if (!data) return <Loader />;
	return <Render {...data} />;
};
