import { z } from "zod";
import { MovieP } from "./movie";
import { ShowP } from "./show";

export const WatchlistP = z.union([
	/*
	 * Either a show
	 */
	ShowP,
	/*
	 * Or a Movie
	 */
	MovieP,
]);

/**
 * A item in the user's watchlist.
 */
export type Watchlist = z.infer<typeof WatchlistP>;
