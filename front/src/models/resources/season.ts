import { z } from "zod";
import { ImagesP, ResourceP } from "../traits";
import { zdate } from "../utils";

export const SeasonP = ResourceP("season").merge(ImagesP).extend({
	/**
	 * The name of this season.
	 */
	name: z.string(),
	/**
	 * The number of this season. This can be set to 0 to indicate specials.
	 */
	seasonNumber: z.number(),
	/**
	 * A quick overview of this season.
	 */
	overview: z.string().nullable(),
	/**
	 * The starting air date of this season.
	 */
	startDate: zdate().nullable(),
	/**
	 * The ending date of this season.
	 */
	endDate: zdate().nullable(),
	/**
	 * The number of episodes available on kyoo of this season.
	 */
	episodesCount: z.number(),
});

/**
 * A season of a Show.
 */
export type Season = z.infer<typeof SeasonP>;
