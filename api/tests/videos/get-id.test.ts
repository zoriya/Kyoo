import { beforeAll, describe, expect, it } from "bun:test";
import { createSerie, createVideo, getVideo } from "tests/helpers";
import { expectStatus } from "tests/utils";
import { db } from "~/db";
import { shows, videos } from "~/db/schema";
import { madeInAbyss } from "~/models/examples";

beforeAll(async () => {
	await db.delete(shows);
	let [ret, _] = await createSerie(madeInAbyss);
	expect(ret.status).toBe(201);
	await db.delete(videos);

	[ret, _] = await createVideo([
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
			path: "/video/Made in abyss s2e2&3.mkv",
			rendering: "mia-s2e2",
			part: null,
			version: 1,
			guess: {
				title: "Made in abyss",
				kind: "episode",
				episodes: [
					{ season: 2, episode: 2 },
					{ season: 2, episode: 3 },
				],
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
			version: 1,
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
	expect(ret.status).toBe(201);
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

	it("Get video with multi-part next", async () => {
		const [resp, body] = await getVideo("made-in-abyss-dawn-of-the-deep-soul", {
			langs: "en",
			with: ["previous", "next"],
		});
		expectStatus(resp, body).toBe(200);
		expect(body).toMatchObject({
			path: "/video/Made in abyss movie.mkv",
			slugs: ["made-in-abyss-dawn-of-the-deep-soul"],
			previous: {
				video: "made-in-abyss-s1e13",
				entry: expect.objectContaining({
					slug: "made-in-abyss-s1e13",
					order: 13,
				}),
			},
			next: {
				video: "made-in-abyss-s2e1-p1",
				entry: expect.objectContaining({
					slug: "made-in-abyss-s2e1",
					seasonNumber: 2,
					episodeNumber: 1,
				}),
			},
		});
	});

	it("Get first part", async () => {
		const [resp, body] = await getVideo("made-in-abyss-s2e1-p1", {
			langs: "en",
			with: ["previous", "next"],
		});
		expectStatus(resp, body).toBe(200);
		expect(body).toMatchObject({
			path: "/video/Made in abyss s2e1 p1.mkv",
			slugs: ["made-in-abyss-s2e1-p1"],
			previous: {
				video: "made-in-abyss-dawn-of-the-deep-soul",
				entry: expect.objectContaining({
					slug: "made-in-abyss-dawn-of-the-deep-soul",
					order: 13.5,
				}),
			},
			next: {
				video: "made-in-abyss-s2e1-p2-v2",
				entry: expect.objectContaining({
					slug: "made-in-abyss-s2e1",
					seasonNumber: 2,
					episodeNumber: 1,
				}),
			},
		});
	});

	it("Get second part", async () => {
		const [resp, body] = await getVideo("made-in-abyss-s2e1-p2-v2", {
			langs: "en",
			with: ["previous", "next"],
		});
		expectStatus(resp, body).toBe(200);
		expect(body).toMatchObject({
			path: "/video/Made in abyss s2e1 p2 v2.mkv",
			slugs: ["made-in-abyss-s2e1-p2-v2"],
			previous: {
				video: "made-in-abyss-s2e1-p1",
				entry: expect.objectContaining({
					slug: "made-in-abyss-s2e1",
					seasonNumber: 2,
					episodeNumber: 1,
				}),
			},
			next: {
				video: "made-in-abyss-s2e2",
				entry: expect.objectContaining({
					slug: "made-in-abyss-s2e2",
					seasonNumber: 2,
					episodeNumber: 2,
				}),
			},
		});
	});

	it("Get v1", async () => {
		const [resp, body] = await getVideo("made-in-abyss-s2e1-p2", {
			langs: "en",
			with: ["previous", "next"],
		});
		expectStatus(resp, body).toBe(200);
		expect(body).toMatchObject({
			path: "/video/Made in abyss s2e1 p2.mkv",
			slugs: ["made-in-abyss-s2e1-p2"],
			previous: {
				video: "made-in-abyss-s2e1-p1",
				entry: expect.objectContaining({
					slug: "made-in-abyss-s2e1",
					seasonNumber: 2,
					episodeNumber: 1,
				}),
			},
			next: {
				video: "made-in-abyss-s2e2",
				entry: expect.objectContaining({
					slug: "made-in-abyss-s2e2",
					seasonNumber: 2,
					episodeNumber: 2,
				}),
			},
		});
	});

	it("Get multi entry video", async () => {
		const [resp, body] = await getVideo("made-in-abyss-s2e2", {
			langs: "en",
			with: ["previous", "next"],
		});
		expectStatus(resp, body).toBe(200);
		expect(body).toMatchObject({
			path: "/video/Made in abyss s2e2&3.mkv",
			slugs: ["made-in-abyss-s2e2", "made-in-abyss-s2e3"],
			previous: {
				// when going to the prev episode, go to the first part of it
				video: "made-in-abyss-s2e1-p1",
				entry: expect.objectContaining({
					slug: "made-in-abyss-s2e1",
					seasonNumber: 2,
					episodeNumber: 1,
				}),
			},
			next: {
				video: "made-in-abyss-s2e4",
				entry: expect.objectContaining({
					slug: "made-in-abyss-s2e4",
					seasonNumber: 2,
					episodeNumber: 4,
				}),
			},
		});
	});

	it("Get multi entry video (ep 2)", async () => {
		const [resp, body] = await getVideo("made-in-abyss-s2e3", {
			langs: "en",
			with: ["previous", "next"],
		});
		expectStatus(resp, body).toBe(200);
		expect(body).toMatchObject({
			path: "/video/Made in abyss s2e2&3.mkv",
			slugs: ["made-in-abyss-s2e2", "made-in-abyss-s2e3"],
			previous: {
				// when going to the prev episode, go to the first part of it
				video: "made-in-abyss-s2e1-p1",
				entry: expect.objectContaining({
					slug: "made-in-abyss-s2e1",
					seasonNumber: 2,
					episodeNumber: 1,
				}),
			},
			next: {
				video: "made-in-abyss-s2e4",
				entry: expect.objectContaining({
					slug: "made-in-abyss-s2e4",
					seasonNumber: 2,
					episodeNumber: 4,
				}),
			},
		});
	});

	it("Get last ep with next=null", async () => {
		const [resp, body] = await getVideo("made-in-abyss-s2e4", {
			langs: "en",
			with: ["previous", "next"],
		});
		expectStatus(resp, body).toBe(200);
		expect(body).toMatchObject({
			path: "/video/Made in abyss s2e4.mkv",
			slugs: ["made-in-abyss-s2e4"],
			previous: {
				video: "made-in-abyss-s2e3",
				entry: expect.objectContaining({
					slug: "made-in-abyss-s2e3",
					seasonNumber: 2,
					episodeNumber: 3,
				}),
			},
			next: null,
		});
	});
});
