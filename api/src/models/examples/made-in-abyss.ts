import type { Entry, Extra } from "../entry";
import type { Season } from "../season";
import type { Serie } from "../serie";
import type { Video } from "../video";

type CompleteSerie = Serie & {
	seasons: Season[];
	entries: (Entry & { videos: Video[] })[];
	extras: (Extra & { video: Video })[];
};

export const madeInAbyss: CompleteSerie = {
	id: "04bcf2ac-3c09-42f6-8357-b003798f9562",
	slug: "made-in-abyss",
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
	poster: {
		id: "8205a20e-d91f-804c-3a84-4e4dc6202d66",
		source:
			"https://image.tmdb.org/t/p/original/4Bh9qzB1Kau4RDaVQXVFdoJ0HcE.jpg",
		blurhash: "LZGlS3XTD%jE~Wf,SeV@%2o|WERj",
	},
	thumbnail: {
		id: "819d816c-88f6-9f3a-b5e7-ce3daaffbac4",
		source:
			"https://image.tmdb.org/t/p/original/Df9XrvZFIeQfLKfu8evRmzvRsd.jpg",
		blurhash: "LmJtk{kq~q%2bbWCxaV@.8RixuNG",
	},
	logo: {
		id: "23cb7b06-8406-2288-8e40-08bfc16180b5",
		source:
			"https://image.tmdb.org/t/p/original/7hY3Q4GhkiYPBfn4UoVg0AO4Zgk.png",
		blurhash: "LKGaa%M{0zbI#7$%bbofGGw^wcw{",
	},
	banner: null,
	trailerUrl: "https://www.youtube.com/watch?v=ePOyy6Wlk4s",
	externalId: {
		themoviedatabase: {
			dataId: "72636",
			link: "https://www.themoviedb.org/tv/72636",
		},
		imdb: { dataId: "tt7222086", link: "https://www.imdb.com/title/tt7222086" },
		tvdb: { dataId: "326109", link: null },
	},
	createdAt: "2023-11-29T11:12:11.949503Z",
	nextRefresh: "2025-01-07T11:42:50.948248Z",
	seasons: [
		{
			id: "490aa312-53b9-43c2-845d-7cbf32642c98",
			slug: "made-in-abyss-s1",
			seasonNumber: 1,
			name: "Season 1",
			description:
				"Within the depths of the Abyss, a girl named Riko stumbles upon a robot who looks like a young boy. Riko and her new friend descend into uncharted territory to unlock its mysteries, but what lies in wait for them in the darkness?",
			startAir: "2017-07-07",
			endAir: "2017-09-29",
			poster: {
				id: "1c121a2b-d3a2-4ce8-e22a-79b13dde3f7d",
				source:
					"https://image.tmdb.org/t/p/original/uVK3H8CgtrVgySFpdImvNXkN7RK.jpg",
				blurhash: "LYG9BNkrD%V?~WS5S1WA%LbubHV[",
			},
			thumbnail: null,
			banner: null,
			externalId: {
				themoviedatabase: {
					serieId: "72636",
					season: 1,
					link: "https://www.themoviedb.org/tv/72636/season/1",
				},
			},
			createdAt: "2023-11-29T11:12:13.008151Z",
			nextRefresh: "2025-01-07T11:37:50.151836Z",
		},
		{
			id: "135af9ae-a8eb-4110-a4e4-05eee49e2d76",
			slug: "made-in-abyss-s2",
			seasonNumber: 2,
			name: "The Golden City of the Scorching Sun",
			description:
				"Set directly after the events of Made in Abyss: Dawn of the Deep Soul, the fifth installment of Made in Abyss covers the adventure of Reg, Riko and Nanachi in the Sixth Layer, The Capital of the Unreturned.",
			startAir: "2022-07-06",
			endAir: "2022-09-28",
			poster: {
				id: "a03c57d7-4032-7d97-083a-9a6e51d5f1e7",
				source:
					"https://image.tmdb.org/t/p/original/clC2erfUqIezhET67Gz9fcKD1L2.jpg",
				blurhash: "LpNTRGx]s9oz~WbJRPoft7RjV@a|",
			},
			thumbnail: null,
			banner: null,
			externalId: {
				themoviedatabase: {
					serieId: "72636",
					season: 2,
					link: "https://www.themoviedb.org/tv/72636/season/2",
				},
			},
			createdAt: "2023-11-29T11:12:13.630306Z",
			nextRefresh: "2025-01-07T11:09:19.552971Z",
		},
	],
	entries: [
		{
			kind: "episode",
			id: "ab912364-61c8-4752-ac93-5802212467d8",
			slug: "made-in-abyss-s1e13",
			order: 13,
			seasonNumber: 1,
			episodeNumber: 13,
			name: "The Challengers",
			description:
				"Nanachi and Mitty's past is revealed. How did they become what they are and who is responsible for it? Meanwhile, Riko is on the mend after her injuries.",
			runtime: 47,
			airDate: "2017-09-29",
			thumbnail: {
				id: "c2bfd626-bfdb-dee8-caa6-b6a7e7cb74ad",
				source:
					"https://image.tmdb.org/t/p/original/j9t1quh24suXxBetV7Q77YngID6.jpg",
				blurhash: "L370#nD*^jEN}r$$$%J8i_-URkNc",
			},
			externalId: {
				themoviedatabase: {
					serieId: "72636",
					season: 1,
					episode: 13,
					link: "https://www.themoviedb.org/tv/72636/season/1/episode/13",
				},
			},
			createdAt: "2024-10-06T20:09:09.28103Z",
			nextRefresh: "2024-12-06T20:08:42.366583Z",
			videos: [
				{
					id: "0905bddd-8b93-403c-9b9c-db472e55d6cc",
					slug: "made-in-abyss-s1e13",
					path: "/video/Made in Abyss/Made in Abyss S01E13.mkv",
					rendering:
						"e27f226fe5e8d87cd396d0c3d24e1b1135aa563fcfca081bf68c6a71b44de107",
					part: null,
					version: 1,
					createdAt: "2024-10-06T20:09:09.28103Z",
				},
			],
		},
		{
			kind: "special",
			id: "1a83288a-3089-447f-9710-94297d614c51",
			slug: "made-in-abyss-ova3",
			// beween s1e13 & movie (which has 13.5 for the `order field`)
			order: 13.25,
			number: 3,
			name: "Maruruk's Everday 3 - Cleaning",
			description:
				"Short played before Made in Abyss Movie 3: Dawn of the Deep Soul in Japan's theatrical screenings before the main movie from 2020-01-17 to 2020-01-23.",
			runtime: 3,
			airDate: "2020-01-31",
			thumbnail: {
				id: "f4ac4b0a-c857-ea95-4042-601314a26e71",
				source:
					"https://image.tmdb.org/t/p/original/4cMeg2ihvACsGVaSUcQJJZd96Je.jpg",
				blurhash: "LAD,Pg%dc}tPDQfk.7kBo|ayR7WC",
			},
			externalId: {
				themoviedatabase: {
					serieId: "72636",
					season: 0,
					episode: 3,
					link: "https://www.themoviedb.org/tv/72636/season/0/episode/3",
				},
			},
			createdAt: "2024-10-06T20:09:17.551272Z",
			nextRefresh: "2024-12-06T20:08:29.463394Z",
			videos: [
				{
					id: "9153f7dc-b635-4a04-a2db-9c08ea205ec3",
					slug: "made-in-abyss-ova3",
					path: "/video/Made in Abyss/Made in Abyss S00E03.mkv",
					rendering:
						"0391acf2268983de705f65381d252f1b0cd3c3563209303dc50cf71ab400ebf4",
					part: null,
					version: 1,
					createdAt: "2024-10-06T20:09:17.551272Z",
				},
			],
		},
		{
			kind: "movie",
			id: "59312db0-df8c-446e-be26-2b2107d0cbde",
			slug: "made-in-abyss-dawn-of-the-deep-soul",
			order: 13.5,
			name: "Made in Abyss: Dawn of the Deep Soul",
			tagline: "Defy the darkness",
			description:
				"A continuation of the epic adventure of plucky Riko and Reg who are joined by their new friend Nanachi. Together they descend into the Abyss' treacherous fifth layer, the Sea of Corpses, and encounter the mysterious Bondrewd, a legendary White Whistle whose shadow looms over Nanachi's troubled past. Bondrewd is ingratiatingly hospitable, but the brave adventurers know things are not always as they seem in the enigmatic Abyss.",
			runtime: 105,
			airDate: "2020-01-17",
			poster: {
				id: "f4ac4b0a-c857-ea95-4042-601314a26e71",
				source:
					"https://image.tmdb.org/t/p/original/4cMeg2ihvACsGVaSUcQJJZd96Je.jpg",
				blurhash: "LAD,Pg%dc}tPDQfk.7kBo|ayR7WC",
			},
			externalId: {
				themoviedatabase: {
					dataId: "72636",
					link: "https://www.themoviedb.org/tv/72636/season/0/episode/3",
				},
			},
			createdAt: "2024-10-06T20:09:17.551272Z",
			nextRefresh: "2024-12-06T20:08:29.463394Z",
			videos: [
				{
					id: "d3cedfc5-23f4-4aab-b4d3-98bef2954442",
					slug: "made-in-abyss-dawn-of-the-deep-soul",
					path: "/video/Made in Abyss/Made in Abyss Dawn of the Deep Soul.mkv",
					rendering:
						"a59ba5d88a4935d900db312422eec6f16827ce2572cc8c0eb6c8fffc5e235d6d",
					part: null,
					version: 1,
					createdAt: "2024-10-06T20:09:17.551272Z",
				},
			],
		},
		{
			kind: "episode",
			id: "bd155be3-39d0-4253-bb29-a60bedb62943",
			slug: "made-in-abyss-s2e1",
			order: 14,
			seasonNumber: 2,
			episodeNumber: 1,
			name: "The Compass Pointed to the Darkness",
			description:
				"An old man speaks of a golden city that lies within a devouring abyss somewhere in uncharted waters. One explorer may be the key to finding both.",
			runtime: 23,
			airDate: "2022-07-06",
			thumbnail: {
				id: "072da617-f349-4a68-eb27-d097624b373c",
				source:
					"https://image.tmdb.org/t/p/original/Tgu6E3aMf7sFHFbEIMEjetnpMi.jpg",
				blurhash: "LOI#x]yE01xtE2D*kWt7NGjENGM|",
			},
			externalId: {
				themoviedatabase: {
					serieId: "72636",
					season: 2,
					episode: 1,
					link: "https://www.themoviedb.org/tv/72636/season/2/episode/1",
				},
			},
			createdAt: "2024-10-06T20:09:05.651996Z",
			nextRefresh: "2024-12-06T20:08:22.854073Z",
			videos: [
				{
					id: "3cbcc337-f1da-486a-93bd-c705a58545eb",
					slug: "made-in-abyss-s2e1-p1",
					path: "/video/Made in Abyss/Made In Abyss S02E01 Part 1.mkv",
					rendering:
						"6239d558696fd1cbcd70a67346e748382fe141bbe7ea01a5d702cdcc02aa996f",
					part: 1,
					version: 1,
					createdAt: "2024-10-06T20:09:05.651996Z",
				},
				{
					id: "67b37a00-7459-4287-9bbf-e058675850b5",
					slug: "made-in-abyss-s2e1-p2",
					path: "/video/Made in Abyss/Made In Abyss S02E01 Part 2.mkv",
					rendering:
						"6239d558696fd1cbcd70a67346e748382fe141bbe7ea01a5d702cdcc02aa996f",
					part: 2,
					version: 1,
					createdAt: "2024-10-06T20:09:05.651996Z",
				},
			],
		},
	],
	extras: [
		{
			kind: "behind-the-scenes",
			id: "a9b27fcc-9423-44ad-b875-d35a7a25b613",
			slug: "made-in-abyss-the-making-of-01",
			name: "The Making of MADE IN ABYSS 01",
			description: null,
			runtime: 17,
			airDate: "2017-10-25",
			thumbnail: null,
			externalId: {
				themoviedatabase: {
					serieId: "72636",
					season: 0,
					episode: 13,
					link: "https://thetvdb.com/series/made-in-abyss/episodes/8835068",
				},
			},
			createdAt: "2024-10-06T20:09:05.651996Z",
			nextRefresh: "2024-12-06T20:08:22.854073Z",
			video: {
				id: "ee3f58eb-0f72-423e-b247-0695cfabfa88",
				slug: "made-in-abyss-s2e1-p2",
				path: "/video/Made in Abyss/Made In Abyss S02E01 Part 2.mkv",
				rendering:
					"6239d558696fd1cbcd70a67346e748382fe141bbe7ea01a5d702cdcc02aa996f",
				part: 2,
				version: 1,
				createdAt: "2024-10-06T20:09:05.651996Z",
			},
		},
	],
};
