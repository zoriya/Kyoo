import { t } from "elysia";
import { Collection } from "./collections";
import { Movie } from "./movie";
import { Serie } from "./serie";

export const Show = t.Union([
	t.Intersect([t.Object({ kind: t.Literal("movie") }), Movie]),
	t.Intersect([t.Object({ kind: t.Literal("serie") }), Serie]),
	t.Intersect([t.Object({ kind: t.Literal("collection") }), Collection]),
]);
export type Show = typeof Show.static;
