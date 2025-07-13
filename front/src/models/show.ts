import { z } from "zod/v4";
import { Collection } from "./collection";
import { Movie } from "./movie";
import { Serie } from "./serie";

export const Show = z.union([
	Serie.and(z.object({ kind: z.literal("serie") })),
	Movie.and(z.object({ kind: z.literal("movie") })),
	Collection.and(z.object({ kind: z.literal("collection") })),
]);
export type Show = z.infer<typeof Show>;

export type WatchStatusV = NonNullable<Serie["watchStatus"]>["status"];
export const WatchStatusV = [
	"completed",
	"watching",
	"rewatching",
	"dropped",
	"planned",
] as const;
