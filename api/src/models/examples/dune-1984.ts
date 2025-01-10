import type { SeedMovie } from "../movie";
import type { Video } from "../video";

export const dune1984Video: Video = {
	id: "d1a62b87-9cfd-4f9c-9ad7-21f9b7fa6290",
	slug: "dune-1984",
	path: "/video/Dune_1984/Dune (1984).mkv",
	rendering: "ea3a0f8f2f2c5b61a07f61e4e8d9f8e01b2b92bcbb6f5ed1151e1f61619c2c0f",
	part: null,
	version: 1,
	createdAt: "2024-12-02T11:45:12.968Z",
};

export const dune1984: SeedMovie = {
	slug: "dune-1984",
	translations: {
		en: {
			name: "Dune",
			tagline: "A journey to the stars begins with a single step.",
			description:
				"On the planet Arrakis, the young Paul Atreides and his family are thrust into a world of political intrigue and warfare over control of the spice melange, the most valuable substance in the universe.",
			aliases: ["Dune 1984", "Dune: David Lynch's Vision", "Dune: The Movie"],
			tags: ["sci-fi", "adventure", "drama", "cult-classic", "epic"],
			poster:
				"https://image.tmdb.org/t/p/original/eVnVrIWkT8esL3XsTc4BjhDhQKq.jpg",
			thumbnail:
				"https://image.tmdb.org/t/p/original/pCHV6BntWLO2H6wQOj4LwzAWqpa.jpg",
			banner: null,
			logo: "https://image.tmdb.org/t/p/original/olbKnk2VvFcM2STl0dJAf6kfydo.png",
			trailerUrl: "https://www.youtube.com/watch?v=vczYTLQ6oiE",
		},
	},
	genres: ["adventure", "drama", "science-fiction"],
	rating: 60,
	status: "finished",
	runtime: 137,
	airDate: "1984-12-14",
	originalLanguage: "en",
	externalId: {
		themoviedatabase: {
			dataId: "9495",
			link: "https://www.themoviedb.org/movie/9495",
		},
		imdb: {
			dataId: "tt0087182",
			link: "https://www.imdb.com/title/tt0087182",
		},
	},
	videos: [dune1984Video.id],
};

export const dune1984Images = {
	poster: {
		id: "a5e1c5e4-4176-42f0-a279-8ab6f1ae2d30",
		source:
			"https://image.tmdb.org/t/p/original/eVnVrIWkT8esL3XsTc4BjhDhQKq.jpg",
		blurhash: "L32^9tc~%8~U%OItfNGq9FoLV@X9",
	},
	thumbnail: {
		id: "fe44141b-58bc-42b7-a5c5-e10b801e99ae",
		source:
			"https://image.tmdb.org/t/p/original/pCHV6BntWLO2H6wQOj4LwzAWqpa.jpg",
		blurhash: "L56~XM~q9ZZX4wbD9Wa|ECxvS~V@",
	},
	banner: null,
	logo: {
		id: "515d7d72-b4f0-4a7d-a27a-eac3495ea8b3",
		source:
			"https://image.tmdb.org/t/p/original/olbKnk2VvFcM2STl0dJAf6kfydo.png",
		blurhash: "LJ4XXK*]JFMzM]V?~Xz$sV?tMdm+",
	},
};
