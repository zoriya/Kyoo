import z from "zod";
import { Collection } from "./collection";
import { Movie } from "./movie";
import { Serie } from "./serie";

export const Show = z.union([
	Serie.and(z.object({ kind: z.literal("serie") })),
	Movie.and(z.object({ kind: z.literal("movie") })),
	Collection.and(z.object({ kind: z.literal("collection") })),
]);
export type Show = z.infer<typeof Show>;
