import { z } from "zod";
import { zdate } from "../utils";
import { BaseEpisodeP } from "./episode.base";

export enum WatchStatusV {
	Completed = "Completed",
	Watching = "Watching",
	Droped = "Droped",
	Planned = "Planned",
}

export const WatchStatusP = z.object({
	/**
	 * The date this item was added to the watchlist (watched or plan to watch by the user).
	 */
	addedDate: zdate(),
	/**
	 * The date at which this item was played.
	 */
	playedDate: zdate().nullable(),
	/**
	 * Has the user started watching, is it planned?
	 */
	status: z.nativeEnum(WatchStatusV),
	/**
	 * Where the player has stopped watching the episode (in seconds).
	 * Null if the status is not Watching or if the next episode is not started.
	 */
	watchedTime: z.number().int().gte(0).nullable(),
	/**
	 * Where the player has stopped watching the episode (in percentage between 0 and 100).
	 * Null if the status is not Watching or if the next episode is not started.
	 */
	watchedPercent: z.number().int().gte(0).lte(100).nullable(),
});
export type WatchStatus = z.infer<typeof WatchStatusP>;

export const ShowWatchStatusP = WatchStatusP.and(
	z.object({
		/**
		 * The number of episodes the user has not seen.
		 */
		unseenEpisodesCount: z.number().int().gte(0),
		/**
		 * The next episode to watch
		 */
		nextEpisode: BaseEpisodeP.nullable(),
	}),
);
export type ShowWatchStatus = z.infer<typeof ShowWatchStatusP>;
