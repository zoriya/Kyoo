import { z } from "zod";
import { CollectionP } from "./collection";
import { MovieP } from "./movie";
import { ShowP } from "./show";

export const LibraryItemP = z.union([
	/*
	 * Either a Show
	 */
	ShowP,
	/*
	 * Or a Movie
	 */
	MovieP,
	/*
	 * Or a Collection
	 */
	CollectionP,
]);

/**
 * An item that can be contained by a Library (so a Show, a Movie or a Collection).
 */
export type LibraryItem = z.infer<typeof LibraryItemP>;
