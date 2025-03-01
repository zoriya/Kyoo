import type { UnknownEntry } from "~/models/entry";

export const youtubeExample: Partial<UnknownEntry> = {
	kind: "unknown",
	// idk if we'll keep non-ascii characters or if we can find a way to convert them
	slug: "lisa-炎-the-first-take",
	name: "LiSA - 炎 / THE FIRST TAKE",
	runtime: 10,
	thumbnail: null,
};
