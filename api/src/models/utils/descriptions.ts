import { comment } from "~/utils";

export const desc = {
	preferOriginal: comment`
		Prefer images in the original's language. If true, will return untranslated images instead of the translated ones.

		If unspecified, kyoo will look at the current user's settings to decide what to do.
	`,

	after: comment`
		Id of the cursor in the pagination.
		You can ignore this and only use the prev/next field in the response.
	`,

	query: comment`
		Search query.
		Searching automatically sort via relevance before the other sort parameters.
	`,
};
