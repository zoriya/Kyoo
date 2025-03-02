import type { SeedCollection } from "~/models/collections";

export const duneCollection: SeedCollection = {
	slug: "dune-collection",
	translations: {
		en: {
			name: " Dune Collection",
			tagline: "A mythic and emotionally charged hero's journey.",
			description:
				"The saga of Paul Atreides and his rise to power on the deadly planet Arrakis.",
			aliases: [],
			tags: ["sci-fi", "adventure", "drama", "action", "epic"],
			poster:
				"https://image.tmdb.org/t/p/original/wD57HqZ6fXwwDdfQLo4hXLRwGV1.jpg",
			thumbnail:
				"https://image.tmdb.org/t/p/original/k2ocXnNkmvE6rJomRkExIStFq3v.jpg",
			banner: null,
			logo: "https://image.tmdb.org/t/p/original/5nDsd3u1c6kDphbtIqkHseLg7HL.png",
		},
	},
	genres: ["adventure", "science-fiction"],
	rating: 80,
	externalId: {
		themoviedatabase: {
			dataId: "726871",
			link: "https://www.themoviedb.org/collection/726871-dune-collection",
		},
	},
};
