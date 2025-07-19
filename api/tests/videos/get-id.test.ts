import { beforeAll, describe, expect, it } from "bun:test";
import { createSerie, createVideo, getVideo } from "tests/helpers";
import { expectStatus } from "tests/utils";
import { db } from "~/db";
import { shows, videos } from "~/db/schema";
import { madeInAbyss } from "~/models/examples";

beforeAll(async () => {
	await db.delete(shows);
	const [ret, _] = await createSerie(madeInAbyss);
	expect(ret.status).toBe(201);
	await db.delete(videos);

	await createVideo([
		{
			path: "/video/Made in abyss S01E13.mkv",
			rendering: "mia13",
			part: null,
			version: 1,
			guess: {
				title: "Made in abyss",
				episodes: [{ season: 1, episode: 13 }],
				kind: "episode",
				from: "guessit",
				history: [],
			},
			for: [{ serie: madeInAbyss.slug, season: 1, episode: 13 }],
		},
		{
			path: "/video/Made in abyss movie.mkv",
			rendering: "mia-movie",
			part: null,
			version: 1,
			guess: {
				title: "Made in abyss",
				kind: "movie",
				from: "guessit",
				history: [],
			},
			// TODO: i feel like there's a better way than that. we need to make this api better
			for: [{ serie: madeInAbyss.slug, order: 13.5 }],
		},
		{
			path: "/video/Made in abyss s2e1 p1.mkv",
			rendering: "mia-s2e1",
			part: 1,
			version: 1,
			guess: {
				title: "Made in abyss",
				kind: "episode",
				episodes: [{ season: 2, episode: 1 }],
				from: "guessit",
				history: [],
			},
			for: [{ serie: madeInAbyss.slug, season: 2, episode: 1 }],
		},
		{
			path: "/video/Made in abyss s2e1 p2.mkv",
			rendering: "mia-s2e1",
			part: 2,
			version: 1,
			guess: {
				title: "Made in abyss",
				kind: "episode",
				episodes: [{ season: 2, episode: 1 }],
				from: "guessit",
				history: [],
			},
			for: [{ serie: madeInAbyss.slug, season: 2, episode: 1 }],
		},
		{
			path: "/video/Made in abyss s2e1 p2 v2.mkv",
			rendering: "mia-s2e1",
			part: 2,
			version: 2,
			guess: {
				title: "Made in abyss",
				kind: "episode",
				episodes: [{ season: 2, episode: 1 }],
				from: "guessit",
				history: [],
			},
			for: [{ serie: madeInAbyss.slug, season: 2, episode: 1 }],
		},
		{
			path: "/video/Made in abyss s2e2.mkv",
			rendering: "mia-s2e2",
			part: null,
			version: 2,
			guess: {
				title: "Made in abyss",
				kind: "episode",
				episodes: [{ season: 2, episode: 2 }],
				from: "guessit",
				history: [],
			},
			for: [
				{ serie: madeInAbyss.slug, season: 2, episode: 2 },
				{ serie: madeInAbyss.slug, season: 2, episode: 3 },
			],
		},
		{
			path: "/video/Made in abyss s2e4.mkv",
			rendering: "mia-s2e4",
			part: null,
			version: 2,
			guess: {
				title: "Made in abyss",
				kind: "episode",
				episodes: [{ season: 2, episode: 4 }],
				from: "guessit",
				history: [],
			},
			for: [{ serie: madeInAbyss.slug, season: 2, episode: 4 }],
		},
	]);
});

describe("Get videos", () => {
	it("Invalid slug", async () => {
		const [resp, body] = await getVideo("sotneuhn", { langs: "en" });
		expectStatus(resp, body).toBe(404);
		expect(body).toMatchObject({
			status: 404,
			message: expect.any(String),
		});
	});

	it("Get video", async () => {
		const [resp, body] = await getVideo("made-in-abyss-s1e13", { langs: "en" });
		expectStatus(resp, body).toBe(200);
		expect(body).toMatchObject({
			id: expect.any(String),
			path: "/video/Made in abyss S01E13.mkv",
			rendering: "mia13",
			part: null,
			version: 1,
			guess: {
				title: "Made in abyss",
				episodes: [{ season: 1, episode: 13 }],
				kind: "episode",
				from: "guessit",
				history: [],
			},
			slugs: ["made-in-abyss-s1e13"],
		});
	});

	it("Get video with null previous", async () => {
		const [resp, body] = await getVideo("made-in-abyss-s1e13", {
			langs: "en",
			with: ["previous"],
		});
		expectStatus(resp, body).toBe(200);
		expect(body).toMatchObject({
			id: expect.any(String),
			path: "/video/Made in abyss S01E13.mkv",
			rendering: "mia13",
			part: null,
			version: 1,
			guess: {
				title: "Made in abyss",
				episodes: [{ season: 1, episode: 13 }],
				kind: "episode",
				from: "guessit",
				history: [],
			},
			slugs: ["made-in-abyss-s1e13"],
			previous: null,
		});
	});

	it("Get video with movie next", async () => {
		const [resp, body] = await getVideo("made-in-abyss-s1e13", {
			langs: "en",
			with: ["previous", "next"],
		});
		expectStatus(resp, body).toBe(200);
		expect(body).toMatchObject({
			id: expect.any(String),
			path: "/video/Made in abyss S01E13.mkv",
			rendering: "mia13",
			part: null,
			version: 1,
			guess: {
				title: "Made in abyss",
				episodes: [{ season: 1, episode: 13 }],
				kind: "episode",
				from: "guessit",
				history: [],
			},
			slugs: ["made-in-abyss-s1e13"],
			previous: null,
			next: {
				video: "made-in-abyss-dawn-of-the-deep-soul",
				entry: expect.objectContaining({
					slug: "made-in-abyss-dawn-of-the-deep-soul",
					name: "Made in Abyss: Dawn of the Deep Soul",
					order: 13.5,
				}),
			},
		});
	});
});
