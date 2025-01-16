import type { SeedMovie } from "../movie";
import type { Video } from "../video";

export const bubbleVideo: Video = {
	id: "3cd436ee-01ff-4f45-ba98-62aabeb22f25",
	slug: "bubble",
	path: "/video/Bubble/Bubble (2022).mkv",
	rendering: "459429fa062adeebedcc2bb04b9965de0262bfa453369783132d261be79021bd",
	part: null,
	version: 1,
	createdAt: "2024-11-23T15:01:24.968Z",
};

export const bubble: SeedMovie = {
	slug: "bubble",
	translations: {
		en: {
			name: "Bubble",
			tagline: "Is she a calamity or a blessing?",
			description:
				"In an abandoned Tokyo overrun by bubbles and gravitational abnormalities, one gifted young man has a fateful meeting with a mysterious girl.",
			aliases: ["Baburu", "Bubble"],
			tags: ["adolescence", "disaster", "battle", "gravity", "anime"],
			poster:
				"https://image.tmdb.org/t/p/original/kk28Lk8oQBGjoHRGUCN2vxKb4O2.jpg",
			thumbnail:
				"https://image.tmdb.org/t/p/original/a8Q2g0g7XzAF6gcB8qgn37ccb9Y.jpg",
			banner: null,
			logo: null,
			trailerUrl: "https://www.youtube.com/watch?v=vs7zsyIZkMM",
		},
		jp: {
			name: "バブル：2022",
			tagline: null,
			description: null,
			aliases: ["Baburu", "Bubble"],
			tags: ["アニメ"],
			poster:
				"https://image.tmdb.org/t/p/original/65dad96VE8FJPEdrAkhdsuWMWH9.jpg",
			thumbnail:
				"https://image.tmdb.org/t/p/original/a8Q2g0g7XzAF6gcB8qgn37ccb9Y.jpg",
			banner: null,
			logo: "https://image.tmdb.org/t/p/original/ihIs7fayAmZieMlMQbs6TWM77uf.png",
			trailerUrl: "https://www.youtube.com/watch?v=vs7zsyIZkMM",
		},
	},
	genres: ["animation", "adventure", "science-fiction", "fantasy"],
	rating: 74,
	status: "finished",
	runtime: 101,
	airDate: "2022-02-14",
	originalLanguage: "ja",
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
	videos: [bubbleVideo.id],
};

export const bubbleImages = {
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
};
