import { t } from "elysia";
import { Collection } from "./collections";
import { Movie } from "./movie";
import { Serie } from "./serie";

export const Show = t.Union([Movie, Serie, Collection]);
