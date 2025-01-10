import type { SeedMovie } from "../movie";
import type { Video } from "../video";

export const duneVideo: Video = {
	id: "c9a0d02e-6b8e-4ac1-b431-45b022ec0708",
	slug: "dune",
	path: "/video/Dune/Dune (2021).mkv",
	rendering: "f1953a4fb58247efb6c15b76468b6a9d13b4155b02094863b1a4f0c3fbb6db58",
	part: null,
	version: 1,
	createdAt: "2024-12-02T10:10:24.968Z",
};

export const dune: SeedMovie = {
	slug: "dune",
	translations: {
		en: {
			name: "Dune",
			tagline: "A mythic and emotionally charged hero's journey.",
			description:
				"On the desert planet Arrakis, a young nobleman becomes embroiled in a complex struggle for control of the planet's valuable resource, the spice melange.",
			aliases: ["Dune: Part One", "Dune 2021"],
			tags: ["sci-fi", "adventure", "drama", "action", "epic"],
			poster:
				"https://image.tmdb.org/t/p/original/wD57HqZ6fXwwDdfQLo4hXLRwGV1.jpg",
			thumbnail:
				"https://image.tmdb.org/t/p/original/k2ocXnNkmvE6rJomRkExIStFq3v.jpg",
			banner: null,
			logo: "https://image.tmdb.org/t/p/original/5nDsd3u1c6kDphbtIqkHseLg7HL.png",
			trailerUrl: "https://www.youtube.com/watch?v=n9xhJrPXop4",
		},
	},
	genres: ["adventure", "drama", "science-fiction", "action"],
	rating: 83,
	status: "finished",
	runtime: 155,
	airDate: "2021-10-22",
	originalLanguage: "en",
	externalId: {
		themoviedatabase: {
			dataId: "496243",
			link: "https://www.themoviedb.org/movie/496243",
		},
		imdb: {
			dataId: "tt1160419",
			link: "https://www.imdb.com/title/tt1160419",
		},
	},
	videos: [duneVideo.id],
};

export const duneImages = {
	poster: {
		id: "ea0426d1-4d16-4be9-9e6f-08e5fdf8f209",
		source:
			"https://image.tmdb.org/t/p/original/wD57HqZ6fXwwDdfQLo4hXLRwGV1.jpg",
		blurhash: "L3D8AK$A5l=j~Bt7_4Mw-;WBt4Gf",
	},
	thumbnail: {
		id: "1b629b7f-3b44-45b9-9432-cb5505045899",
		source:
			"https://image.tmdb.org/t/p/original/k2ocXnNkmvE6rJomRkExIStFq3v.jpg",
		blurhash: "L6l5}7$S0nt7p~2R.9W9tQ%NflWC",
	},
	banner: null,
	logo: {
		id: "c02ec0d2-d04e-4f51-8d4e-4cdd9ca75a7e",
		source:
			"https://image.tmdb.org/t/p/original/5nDsd3u1c6kDphbtIqkHseLg7HL.png",
		blurhash: "LLOQ0t-7e,X6jY?qBtt6c8A4gYof",
	},
};
