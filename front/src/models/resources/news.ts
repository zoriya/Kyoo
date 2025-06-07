import { z } from "zod";
import { EpisodeP } from "./episode";
import { MovieP } from "./movie";

export const NewsP = z.union([
	/*
	 * Either an episode
	 */
	EpisodeP,
	/*
	 * Or a Movie
	 */
	MovieP,
]);

/**
 * A new item added to kyoo.
 */
export type News = z.infer<typeof NewsP>;
