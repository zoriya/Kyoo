import { comment } from "~/utils";

export const desc = {
	after: comment`
		Cursor for the pagination.
		You can ignore this and only use the prev/next field in the response.
	`,

	query: comment`
		Search query.
		Searching automatically sort via relevance before the other sort parameters.
	`,
};
