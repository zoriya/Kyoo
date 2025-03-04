import { z } from "zod";
import { ImagesP, ResourceP } from "../traits";

export const PersonP = ResourceP("people").merge(ImagesP).extend({
	/**
	 * The name of this person.
	 */
	name: z.string(),
	/**
	 * The type of work the person has done for the show. That can be something like "Actor",
	 * "Writer", "Music", "Voice Actor"...
	 */
	type: z.string().optional(),

	/**
	 * The role the People played. This is mostly used to inform witch character was played for actor
	 * and voice actors.
	 */
	role: z.string().optional(),
});

/**
 * A studio that make shows.
 */
export type Person = z.infer<typeof PersonP>;
