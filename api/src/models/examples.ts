import type { TSchema } from "elysia";
import type { CompleteVideo } from "./video";

export const registerExamples = <T extends TSchema>(
	schema: T,
	...examples: (T["static"] | undefined)[]
) => {
	for (const example of examples) {
		if (!example) continue;
		for (const [key, val] of Object.entries(example)) {
			const prop = schema.properties[
				key as keyof typeof schema.properties
			] as TSchema;
			if (!prop) continue;
			prop.examples ??= [];
			prop.examples.push(val);
		}
	}
};

export const bubble: CompleteVideo = {
	id: "0934da28-4a49-404e-920b-a150404a3b6d",
	path: "/video/Bubble/Bubble (2022).mkv",
	rendering: 0,
	part: 0,
	version: 1,
	createdAt: "2023-11-29T11:42:06.030838Z",
	movie: {
		id: "008f0b42-61b8-4155-857a-cbe5f40dd35d",
		slug: "bubble",
		name: "Bubble",
		tagline: "Is she a calamity or a blessing?",
		description:
			"In an abandoned Tokyo overrun by bubbles and gravitational abnormalities, one gifted young man has a fateful meeting with a mysterious girl.",
		aliases: ["Baburu", "バブル：2022", "Bubble"],
		tags: ["adolescence", "disaster", "battle", "gravity", "anime"],
		genres: ["animation", "adventure", "science-fiction", "fantasy"],
		rating: 74,
		status: "finished",
		runtime: 101,
		airDate: "2022-02-14",
		originalLanguage: "ja",
		poster: {
			id: "befdc7dd-2a67-0704-92af-90d49eee0315",
			source:
				"https://image.tmdb.org/t/p/original/65dad96VE8FJPEdrAkhdsuWMWH9.jpg",
			blurhash: "LFC@2F;K$%xZ5?W.MwNF0iD~MxR:",
		},
		thumbnail: {
			id: "b29908f3-a64d-ae98-923b-18bf7995ab04",
			source:
				"https://image.tmdb.org/t/p/original/a8Q2g0g7XzAF6gcB8qgn37ccb9Y.jpg",
			blurhash: "LpH3afE1XAveyGS7t6V[R4xZn+S6",
		},
		banner: null,
		logo: {
			id: "3357fad0-de40-4ca5-15e6-eb065d35be86",
			source:
				"https://image.tmdb.org/t/p/original/ihIs7fayAmZieMlMQbs6TWM77uf.png",
			blurhash: "LMDc5#MwE0,sTKE0R*S~4mxunhb_",
		},
		trailerUrl: "https://www.youtube.com/watch?v=vs7zsyIZkMM",
		createdAt: "2023-11-29T11:42:06.030838Z",
		nextRefresh: "2025-01-07T22:40:59.960952Z",
		externalId: {
			themoviedatabase: {
				dataId: "912598",
				link: "https://www.themoviedb.org/movie/912598",
			},
			imdb: {
				dataId: "tt16360006",
				link: "https://www.imdb.com/title/tt16360006",
			},
		},
	},
};
