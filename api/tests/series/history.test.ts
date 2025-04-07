import { beforeAll, describe, expect, it } from "bun:test";
import {
	addToHistory,
	createMovie,
	createSerie,
	getEntries,
	getHistory,
	getNews,
} from "tests/helpers";
import { expectStatus } from "tests/utils";
import { db } from "~/db";
import { entries, shows, videos } from "~/db/schema";
import { bubble, madeInAbyss, madeInAbyssVideo } from "~/models/examples";

beforeAll(async () => {
	await db.delete(shows);
	await db.delete(entries);
	await db.delete(videos);
	// create video beforehand to test linking
	await db.insert(videos).values(madeInAbyssVideo);
	let [ret, body] = await createSerie(madeInAbyss);
	expectStatus(ret, body).toBe(201);
	[ret, body] = await createMovie(bubble);
	expectStatus(ret, body).toBe(201);
});

const miaEntrySlug = `${madeInAbyss.slug}-s1e13`;

describe("Set & get history", () => {
	it("Add episodes & movie to history", async () => {
		let [resp, body] = await getHistory("me", {});
		expectStatus(resp, body).toBe(200);
		expect(body.items).toBeArrayOfSize(0);

		const [r, b] = await addToHistory("me", [
			{
				entry: miaEntrySlug,
				videoId: madeInAbyssVideo.id,
				percent: 58,
				time: 28 * 60 + 12,
				playedDate: "2025-02-01",
			},
			{
				entry: bubble.slug,
				videoId: null,
				percent: 100,
				time: 2 * 60,
				playedDate: "2025-02-02",
			},
		]);
		expectStatus(r, b).toBe(201);
		expect(b.inserted).toBe(2);

		[resp, body] = await getHistory("me", {});
		expectStatus(resp, body).toBe(200);
		expect(body.items).toBeArrayOfSize(2);
		expect(body.items[0].slug).toBe(bubble.slug);
		expect(body.items[0].progress).toMatchObject({
			percent: 100,
			time: 2 * 60,
		});
		expect(body.items[1].slug).toBe(miaEntrySlug);
		expect(body.items[1].progress).toMatchObject({
			percent: 58,
			videoId: madeInAbyssVideo.id,
		});
	});

	it("Create duplicated history entry", async () => {
		const [r, b] = await addToHistory("me", [
			{
				entry: miaEntrySlug!,
				videoId: madeInAbyssVideo.id,
				percent: 100,
				time: 38 * 60,
				playedDate: "2025-02-03",
			},
		]);
		expectStatus(r, b).toBe(201);
		expect(b.inserted).toBe(1);

		const [resp, body] = await getHistory("me", {});
		expectStatus(resp, body).toBe(200);
		expect(body.items).toBeArrayOfSize(3);
		expect(body.items[0].slug).toBe(miaEntrySlug);
		expect(body.items[0].progress).toMatchObject({
			percent: 100,
			videoId: madeInAbyssVideo.id,
		});
		expect(body.items[1].slug).toBe(bubble.slug);
		expect(body.items[1].progress).toMatchObject({
			percent: 100,
			time: 2 * 60,
		});
		expect(body.items[2].slug).toBe(miaEntrySlug);
		expect(body.items[2].progress).toMatchObject({
			percent: 58,
			videoId: madeInAbyssVideo.id,
		});
	});

	it("Return progress in /shows/:id/entries", async () => {
		const [resp, body] = await getEntries(madeInAbyss.slug, { langs: "en" });

		expectStatus(resp, body).toBe(200);
		expect(body.items).toBeArrayOfSize(madeInAbyss.entries.length);
		expect(body.items[0].progress).toMatchObject({
			percent: 100,
			time: 38 * 60,
			videoId: madeInAbyssVideo.id,
			playedDate: "2025-02-03 00:00:00+00",
		});
	});

	it("Return progress in /news", async () => {
		const [resp, body] = await getNews({ langs: "en" });

		expectStatus(resp, body).toBe(200);
		const entry = body.items.find((x: any) => x.slug === miaEntrySlug);
		expect(entry.progress).toMatchObject({
			percent: 100,
			time: 38 * 60,
			videoId: madeInAbyssVideo.id,
			playedDate: "2025-02-03 00:00:00+00",
		});
	});

	// extras, unknowns

	// it("Update watchlist", async () => {
	// 	const [r, b] = await setMovieStatus(bubble.slug, {
	// 		status: "rewatching",
	// 		// we still need to specify all values
	// 		completedAt: "2024-12-21",
	// 		score: 85,
	// 	});
	// 	expectStatus(r, b).toBe(200);
	//
	// 	const [resp, body] = await getMovie(bubble.slug, {});
	// 	expectStatus(resp, body).toBe(200);
	// 	expect(body.slug).toBe(bubble.slug);
	// 	expect(body.progress).toMatchObject({
	// 		status: "rewatching",
	// 		completedAt: "2024-12-21 00:00:00+00",
	// 		score: 85,
	// 		percent: 0,
	// 	});
	// });
});
