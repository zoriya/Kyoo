import { EntityMixin } from "@data-client/rest";
import { z } from "zod/v4";
import { Metadata } from "./utils/metadata";
import { typed, zdate } from "./utils/utils";

const searchMovie = z
	.object({
		id: z.string(),
		slug: z.string(),
		name: z.string(),
		description: z.string().nullable(),
		airDate: zdate().nullable(),
		poster: z.string().nullable(),
		originalLanguage: z.string().nullable(),
		externalId: Metadata,
	})
	.transform((x) => ({ kind: "search-movie", ...x }));

// the scanner's ids are the providers', a movie & a serie can share one
export class SearchMovie extends EntityMixin(
	typed<z.infer<typeof searchMovie>>(class {}),
	{ key: "SearchMovie" },
) {
	static parser = searchMovie.pipe(z.custom<SearchMovie>());
}

const searchSerie = z
	.object({
		id: z.string(),
		slug: z.string(),
		name: z.string(),
		description: z.string().nullable(),
		startAir: zdate().nullable(),
		endAir: zdate().nullable(),
		poster: z.string().nullable(),
		originalLanguage: z.string().nullable(),
		externalId: Metadata,
	})
	.transform((x) => ({ kind: "search-serie", ...x }));

export class SearchSerie extends EntityMixin(
	typed<z.infer<typeof searchSerie>>(class {}),
	{ key: "SearchSerie" },
) {
	static parser = searchSerie.pipe(z.custom<SearchSerie>());
}
