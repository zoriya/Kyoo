import type { Collection } from "@tanstack/react-db";
import type { KyooError } from "~/models";
import { RetryableError } from "~/models/retryable-error";

/**
 * When a `loadSubset` rejects, TanStack DB flags the live query (`isError`)
 * but keeps serving the local rows: screens keep rendering offline and only
 * throw to the error boundary when there is nothing to show.
 */
export const lastLoadError = (collection: Collection<any, any, any> | undefined) =>
	(collection?.utils as { lastSubsetError?: unknown } | undefined)
		?.lastSubsetError;

/** Same mapping as `useFetch`: offline/auth failures become retryable screens. */
export const toRenderableError = (
	error: unknown,
	authToken: string | null,
	retry: () => Promise<void>,
) => {
	if (error instanceof RetryableError)
		return new RetryableError({ key: error.key, inner: error.inner, retry });
	const status = (error as KyooError | null)?.status;
	if (status === 401 || status === 403) {
		return new RetryableError({
			key: !authToken ? "needAccount" : "unauthorized",
			inner: error as KyooError,
			retry,
		});
	}
	return error;
};
