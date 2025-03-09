import { t } from "elysia";
import { Collection } from "./collections";
import { Movie } from "./movie";
import { Serie } from "./serie";

export const Show = t.Union([
	t.Intersect([Movie, t.Object({ kind: t.Literal("movie") })]),
	t.Intersect([Serie, t.Object({ kind: t.Literal("serie") })]),
	t.Intersect([Collection, t.Object({ kind: t.Literal("collection") })]),
]);
