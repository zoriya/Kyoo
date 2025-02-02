import { z } from "zod";
import { BaseEpisodeP } from "./episode.base";
import { ShowP } from "./show";
import { WatchStatusP } from "./watch-status";

export const EpisodeP = BaseEpisodeP.and(
	z.object({
		/**
		 * The episode that come before this one if you follow usual watch orders. If this is the first
		 * episode, it will be null.
		 */
		previousEpisode: BaseEpisodeP.nullable().optional(),
		/**
		 * The episode that come after this one if you follow usual watch orders. If this is the last
		 * aired episode, it will be null.
		 */
		nextEpisode: BaseEpisodeP.nullable().optional(),

		show: ShowP.optional(),
		/**
		 * Metadata of what an user as started/planned to watch.
		 */
		watchStatus: WatchStatusP.optional().nullable(),
	}),
).transform((x) => {
	if (x.show && !x.thumbnail && x.show.thumbnail) x.thumbnail = x.show.thumbnail;
	return x;
});

/**
 * A class to represent a single show's episode.
 */
export type Episode = z.infer<typeof EpisodeP>;
