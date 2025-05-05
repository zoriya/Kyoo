import { beforeAll, describe, expect, it } from "bun:test";
import { eq } from "drizzle-orm";
import {
	createMovie,
	createSerie,
	createVideo,
	deleteVideo,
	getVideos,
} from "tests/helpers";
import { expectStatus } from "tests/utils";
import { db } from "~/db";
import { entries, shows, videos } from "~/db/schema";
import { bubble, madeInAbyss } from "~/models/examples";

beforeAll(async () => {
	await db.delete(shows);
	await db.delete(videos);

	let [ret, body] = await createSerie(madeInAbyss);
	expectStatus(ret, body).toBe(201);
	[ret, body] = await createMovie(bubble);
	expectStatus(ret, body).toBe(201);

	[ret, body] = await createVideo([
		{
			guess: {
				title: "mia",
				episodes: [{ season: 1, episode: 13 }],
				from: "test",
			},
			part: null,
			path: "/video/mia s1e13.mkv",
			rendering: "sha2",
			version: 1,
			for: [{ slug: `${madeInAbyss.slug}-s1e13` }],
		},
		{
			guess: {
				title: "mia",
				episodes: [{ season: 2, episode: 1 }],
				years: [2017],
				from: "test",
			},
			part: null,
			path: "/video/mia 2017 s2e1.mkv",
			rendering: "sha8",
			version: 1,
			for: [{ slug: `${madeInAbyss.slug}-s2e1` }],
		},
		{
			guess: { title: "bubble", from: "test" },
			part: null,
			path: "/video/bubble.mkv",
			rendering: "sha5",
			version: 1,
			for: [{ movie: bubble.slug }],
		},
	]);
	expectStatus(ret, body).toBe(201);
	expect(body).toBeArrayOfSize(3);
	expect(body[0].entries).toBeArrayOfSize(1);
	expect(body[1].entries).toBeArrayOfSize(1);
	expect(body[2].entries).toBeArrayOfSize(1);

	const items = await db.query.shows.findMany();
	expect(items.find((x) => x.slug === "bubble")!.availableCount).toBe(1);
	expect(items.find((x) => x.slug === "made-in-abyss")!.availableCount).toBe(2);

	const etrs = await db.query.entries.findMany({
		where: eq(
			entries.showPk,
			items.find((x) => x.slug === "made-in-abyss")!.pk,
		),
	});
	expect(
		etrs.find((x) => x.slug === "made-in-abyss-s1e13")!.availableSince,
	).not.toBe(null);
	expect(
		etrs.find((x) => x.slug === "made-in-abyss-s2e1")!.availableSince,
	).not.toBe(null);
});

describe("Video get/deletion", () => {
	it("Get current state", async () => {
		const [resp, body] = await getVideos();
		expectStatus(resp, body).toBe(200);
		expect(body.guesses).toMatchObject({
			mia: {
				unknown: {
					id: expect.any(String),
					slug: "made-in-abyss",
				},
				"2017": {
					id: expect.any(String),
					slug: "made-in-abyss",
				},
			},
			bubble: {
				unknown: {
					id: expect.any(String),
					slug: "bubble",
				},
			},
		});
	});

	it("With unknown", async () => {
		let [resp, body] = await createVideo({
			guess: {
				title: "mia",
				episodes: [{ season: 1, episode: 13 }],
				from: "test",
			},
			part: null,
			path: "/video/mia s1e13 unknown test.mkv",
			rendering: "shanthnth",
			version: 1,
		});
		expectStatus(resp, body).toBe(201);

		[resp, body] = await getVideos();
		expectStatus(resp, body).toBe(200);
		expect(body.guesses).toMatchObject({
			mia: {
				unknown: {
					id: expect.any(String),
					slug: "made-in-abyss",
				},
				"2017": {
					id: expect.any(String),
					slug: "made-in-abyss",
				},
			},
			bubble: {
				unknown: {
					id: expect.any(String),
					slug: "bubble",
				},
			},
		});
		expect(body.unmatched).toBeArrayOfSize(1);
		expect(body.unmatched[0]).toBe("/video/mia s1e13 unknown test.mkv");
	});

	it("Mismatch title guess", async () => {
		let [resp, body] = await createVideo({
			guess: {
				title: "mia",
				episodes: [{ season: 1, episode: 13 }],
				from: "test",
			},
			part: null,
			path: "/video/mia s1e13 mismatch.mkv",
			rendering: "mismatch",
			version: 1,
			for: [{ movie: "bubble" }],
		});
		expectStatus(resp, body).toBe(201);

		[resp, body] = await getVideos();
		expectStatus(resp, body).toBe(200);
		expect(body.guesses).toMatchObject({
			mia: {
				unknown: {
					id: expect.any(String),
					// take the latest slug
					slug: "bubble",
				},
				"2017": {
					id: expect.any(String),
					slug: "made-in-abyss",
				},
			},
			bubble: {
				unknown: {
					id: expect.any(String),
					slug: "bubble",
				},
			},
		});
	});

	it("Delete video", async () => {
		const [resp, body] = await deleteVideo(["/video/mia s1e13 mismatch.mkv"]);
		expectStatus(resp, body).toBe(200);
		expect(body).toBeArrayOfSize(1);
		expect(body).toContain("/video/mia s1e13 mismatch.mkv");

		const bubble = await db.query.shows.findFirst({
			where: eq(shows.slug, "bubble"),
		});
		expect(bubble!.availableCount).toBe(1);
	});

	it("Delete all videos of a movie", async () => {
		const [resp, body] = await deleteVideo(["/video/bubble.mkv"]);
		expectStatus(resp, body).toBe(200);
		expect(body).toBeArrayOfSize(1);
		expect(body).toContain("/video/bubble.mkv");

		const bubble = await db.query.shows.findFirst({
			where: eq(shows.slug, "bubble"),
		});
		expect(bubble!.availableCount).toBe(0);
	});

	it("Delete non existing video", async () => {
		const [resp, body] = await deleteVideo(["/video/toto.mkv"]);
		expectStatus(resp, body).toBe(200);
		expect(body).toBeArrayOfSize(0);
	});

	it("Delete episodes", async () => {
		const [resp, body] = await deleteVideo([
			"/video/mia s1e13.mkv",
			"/video/mia 2017 s2e1.mkv",
		]);
		expectStatus(resp, body).toBe(200);
		expect(body).toBeArrayOfSize(2);
		expect(body).toContain("/video/mia s1e13.mkv");
		expect(body).toContain("/video/mia 2017 s2e1.mkv");

		const mia = await db.query.shows.findFirst({
			where: eq(shows.slug, "made-in-abyss"),
		});
		expect(mia!.availableCount).toBe(0);

		const etrs = await db.query.entries.findMany({
			where: eq(entries.showPk, mia!.pk),
		});
		expect(
			etrs.find((x) => x.slug === "made-in-abyss-s1e13")!.availableSince,
		).toBe(null);
		expect(
			etrs.find((x) => x.slug === "made-in-abyss-s2e1")!.availableSince,
		).toBe(null);
	});

	it("Delete unmatched", async () => {
		const [resp, body] = await deleteVideo([
			"/video/mia s1e13 unknown test.mkv",
		]);
		expectStatus(resp, body).toBe(200);
		expect(body).toBeArrayOfSize(1);
		expect(body[0]).toBe("/video/mia s1e13 unknown test.mkv");
	});
});
