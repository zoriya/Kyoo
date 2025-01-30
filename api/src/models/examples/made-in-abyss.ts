import type { SeedSerie } from "~/models/serie";
import type { Video } from "~/models/video";

export const madeInAbyssVideo: Video = {
	id: "3cd436ee-01ff-4f45-ba98-654282531234",
	slug: "made-in-abyss-s1e1",
	path: "/video/Made in abyss S01E01.mkv",
	rendering: "459429fa062adeebedcc2bb04b9965de0262bfa453369783132d261be79021bd",
	part: null,
	version: 1,
	guess: {
		title: "Made in abyss",
		season: [1],
		episode: [1],
		type: "episode",
		from: "guessit",
	},
	createdAt: "2024-11-23T15:01:24.968Z",
};

export const madeInAbyss = {
	slug: "made-in-abyss",
	translations: {
		en: {
			name: "Made in Abyss",
			tagline: "How far would you go… for the ones you love?",
			aliases: [
				"Made in Abyss: The Golden City of the Scorching Sun",
				"Meidoinabisu",
				"Meidoinabisu: Retsujitsu no ôgonkyô",
			],
			description:
				"Located in the center of a remote island, the Abyss is the last unexplored region, a huge and treacherous fathomless hole inhabited by strange creatures where only the bravest adventurers descend in search of ancient relics. In the upper levels of the Abyss, Riko, a girl who dreams of becoming an explorer, stumbles upon a mysterious little boy.",
			tags: [
				"android",
				"amnesia",
				"post-apocalyptic future",
				"exploration",
				"friendship",
				"mecha",
				"survival",
				"curse",
				"tragedy",
				"orphan",
				"based on manga",
				"robot",
				"dark fantasy",
				"seinen",
				"anime",
				"drastic change of life",
				"fantasy",
				"adventure",
			],
			poster:
				"https://image.tmdb.org/t/p/original/4Bh9qzB1Kau4RDaVQXVFdoJ0HcE.jpg",
			thumbnail:
				"https://image.tmdb.org/t/p/original/Df9XrvZFIeQfLKfu8evRmzvRsd.jpg",
			logo: "https://image.tmdb.org/t/p/original/7hY3Q4GhkiYPBfn4UoVg0AO4Zgk.png",
			banner: null,
			trailerUrl: "https://www.youtube.com/watch?v=ePOyy6Wlk4s",
		},
	},
	genres: [
		"animation",
		"drama",
		"action",
		"adventure",
		"science-fiction",
		"fantasy",
	],
	status: "finished",
	rating: 84,
	runtime: 24,
	originalLanguage: "ja",
	startAir: "2017-07-07",
	endAir: "2022-09-28",
	externalId: {
		themoviedatabase: {
			dataId: "72636",
			link: "https://www.themoviedb.org/tv/72636",
		},
		imdb: { dataId: "tt7222086", link: "https://www.imdb.com/title/tt7222086" },
		tvdb: { dataId: "326109", link: null },
	},
	seasons: [
		{
			slug: "made-in-abyss-s1",
			seasonNumber: 1,
			translations: {
				en: {
					name: "Season 1",
					description:
						"Within the depths of the Abyss, a girl named Riko stumbles upon a robot who looks like a young boy. Riko and her new friend descend into uncharted territory to unlock its mysteries, but what lies in wait for them in the darkness?",
					poster:
						"https://image.tmdb.org/t/p/original/uVK3H8CgtrVgySFpdImvNXkN7RK.jpg",
					thumbnail: null,
					banner: null,
				},
			},
			startAir: "2017-07-07",
			endAir: "2017-09-29",
			externalId: {
				themoviedatabase: {
					serieId: "72636",
					season: 1,
					link: "https://www.themoviedb.org/tv/72636/season/1",
				},
			},
		},
		{
			slug: "made-in-abyss-s2",
			seasonNumber: 2,
			translations: {
				en: {
					name: "The Golden City of the Scorching Sun",
					description:
						"Set directly after the events of Made in Abyss: Dawn of the Deep Soul, the fifth installment of Made in Abyss covers the adventure of Reg, Riko and Nanachi in the Sixth Layer, The Capital of the Unreturned.",
					poster:
						"https://image.tmdb.org/t/p/original/clC2erfUqIezhET67Gz9fcKD1L2.jpg",
					thumbnail: null,
					banner: null,
				},
			},
			startAir: "2022-07-06",
			endAir: "2022-09-28",
			externalId: {
				themoviedatabase: {
					serieId: "72636",
					season: 2,
					link: "https://www.themoviedb.org/tv/72636/season/2",
				},
			},
		},
	],
	entries: [
		{
			kind: "episode",
			order: 13,
			seasonNumber: 1,
			episodeNumber: 13,
			translations: {
				en: {
					name: "The Challengers",
					description:
						"Nanachi and Mitty's past is revealed. How did they become what they are and who is responsible for it? Meanwhile, Riko is on the mend after her injuries.",
				},
			},
			runtime: 47,
			airDate: "2017-09-29",
			thumbnail:
				"https://image.tmdb.org/t/p/original/j9t1quh24suXxBetV7Q77YngID6.jpg",
			externalId: {
				themoviedatabase: {
					serieId: "72636",
					season: 1,
					episode: 13,
					link: "https://www.themoviedb.org/tv/72636/season/1/episode/13",
				},
			},
		},
		{
			kind: "special",
			// between s1e13 & movie (which has 13.5 for the `order field`)
			order: 13.25,
			number: 3,
			translations: {
				en: {
					name: "Maruruk's Everday 3 - Cleaning",
					description:
						"Short played before Made in Abyss Movie 3: Dawn of the Deep Soul in Japan's theatrical screenings before the main movie from 2020-01-17 to 2020-01-23.",
				},
			},
			runtime: 3,
			airDate: "2020-01-31",
			thumbnail:
				"https://image.tmdb.org/t/p/original/4cMeg2ihvACsGVaSUcQJJZd96Je.jpg",
			externalId: {
				themoviedatabase: {
					serieId: "72636",
					season: 0,
					episode: 3,
					link: "https://www.themoviedb.org/tv/72636/season/0/episode/3",
				},
			},
		},
		{
			kind: "movie",
			slug: "made-in-abyss-dawn-of-the-deep-soul",
			order: 13.5,
			translations: {
				en: {
					name: "Made in Abyss: Dawn of the Deep Soul",
					tagline: "Defy the darkness",
					description:
						"A continuation of the epic adventure of plucky Riko and Reg who are joined by their new friend Nanachi. Together they descend into the Abyss' treacherous fifth layer, the Sea of Corpses, and encounter the mysterious Bondrewd, a legendary White Whistle whose shadow looms over Nanachi's troubled past. Bondrewd is ingratiatingly hospitable, but the brave adventurers know things are not always as they seem in the enigmatic Abyss.",
					poster:
						"https://image.tmdb.org/t/p/original/4cMeg2ihvACsGVaSUcQJJZd96Je.jpg",
				},
			},
			thumbnail:
				"https://image.tmdb.org/t/p/original/4cMeg2ihvACsGVaSUcQJJZd96Je.jpg",
			runtime: 105,
			airDate: "2020-01-17",
			externalId: {
				themoviedatabase: {
					dataId: "72636",
					link: "https://www.themoviedb.org/tv/72636/season/0/episode/3",
				},
			},
		},
		{
			kind: "episode",
			order: 14,
			seasonNumber: 2,
			episodeNumber: 1,
			translations: {
				en: {
					name: "The Compass Pointed to the Darkness",
					description:
						"An old man speaks of a golden city that lies within a devouring abyss somewhere in uncharted waters. One explorer may be the key to finding both.",
				},
			},
			runtime: 23,
			airDate: "2022-07-06",
			thumbnail:
				"https://image.tmdb.org/t/p/original/Tgu6E3aMf7sFHFbEIMEjetnpMi.jpg",
			externalId: {
				themoviedatabase: {
					serieId: "72636",
					season: 2,
					episode: 1,
					link: "https://www.themoviedb.org/tv/72636/season/2/episode/1",
				},
			},
		},
	],
	extras: [
		{
			kind: "behind-the-scene",
			slug: "made-in-abyss-making-of",
			name: "The Making of MADE IN ABYSS 01",
			runtime: 17,
			thumbnail: null,
			video: "3cd436ee-01ff-4f45-ba98-654282531234",
		},
	],
} satisfies SeedSerie;
