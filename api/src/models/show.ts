import { t } from "elysia";
import { Collection } from "./collections";
import { Movie } from "./movie";
import { Serie } from "./serie";

export const Show = t.Union([
	t.Composite([t.Object({ kind: t.Literal("movie") }), Movie]),
	t.Composite([t.Object({ kind: t.Literal("serie") }), Serie]),
	t.Composite([t.Object({ kind: t.Literal("collection") }), Collection]),
]);
