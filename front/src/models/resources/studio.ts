import { z } from "zod";
import { ResourceP } from "../traits";

export const StudioP = ResourceP("studio").extend({
	/**
	 * The name of this studio.
	 */
	name: z.string(),
});

/**
 * A studio that make shows.
 */
export type Studio = z.infer<typeof StudioP>;
