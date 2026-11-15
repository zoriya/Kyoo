import { beforeAll, describe, expect, it } from "bun:test";
import {
	addToHistory,
	createMovie,
	createSerie,
	getMovie,
	getNextup,
	getSerie,
	getWatchlist,
	setMovieStatus,
	setSerieStatus,
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
const miaNextEntrySlug = "made-in-abyss-dawn-of-the-deep-soul";

describe("nextup", () => {
	it("Watchlist populates nextup", async () => {
		let [r, b] = await setMovieStatus(bubble.slug, {
			status: "watching",
			completedAt: null,
			score: null,
		});
		expectStatus(r, b).toBe(200);
		[r, b] = await setSerieStatus(madeInAbyss.slug, {
			status: "watching",
			startedAt: new Date("2024-12-22"),
			completedAt: null,
			score: null,
		});
		expectStatus(r, b).toBe(200);

		// only edit score, shouldn't change order
		[r, b] = await setMovieStatus(bubble.slug, {
			status: "watching",
			completedAt: null,
			score: 90,
		});
		expectStatus(r, b).toBe(200);

		[r, b] = await getWatchlist("me", {});
		expectStatus(r, b).toBe(200);
		expect(b.items).toBeArrayOfSize(2);

		const [resp, body] = await getNextup("me", {});
		expectStatus(resp, body).toBe(200);
		expect(body.items).toBeArrayOfSize(2);
		expect(body.items[0].slug).toBe(miaEntrySlug);
		expect(body.items[0].progress).toMatchObject({
			percent: 0,
		});
		expect(body.items[1].slug).toBe(bubble.slug);
		expect(body.items[1].progress).toMatchObject({
			percent: 0,
		});
	});

	it("/series/:id?with=nextEntry", async () => {
		const [resp, body] = await getSerie(madeInAbyss.slug, {
			with: ["nextEntry"],
		});
		expectStatus(resp, body).toBe(200);
		expect(body.nextEntry).toBeObject();
		expect(body.nextEntry.slug).toBe(miaEntrySlug);
		expect(body.nextEntry.progress).toMatchObject({
			percent: 0,
		});
	});

	it("history watching doesn't update", async () => {
		let [resp, body] = await addToHistory("me", [
			{
				entry: miaEntrySlug,
				videoId: madeInAbyssVideo.id,
				percent: 58,
				time: 28 * 60 + 12,
				playedDate: new Date("2025-02-01"),
			},
			{
				entry: bubble.slug,
				videoId: null,
				percent: 100,
				time: 2 * 60,
				playedDate: new Date("2025-02-02"),
			},
		]);
		expectStatus(resp, body).toBe(201);
		expect(body.inserted).toBe(2);

		[resp, body] = await getSerie(madeInAbyss.slug, {
			with: ["nextEntry"],
		});
		expectStatus(resp, body).toBe(200);
		expect(body.nextEntry).toBeObject();
		expect(body.nextEntry.slug).toBe(miaEntrySlug);
		expect(body.nextEntry.progress).toMatchObject({
			percent: 58,
			time: 28 * 60 + 12,
			videoId: madeInAbyssVideo.id,
			playedDate: "2025-02-01T00:00:00.000Z",
		});

		[resp, body] = await getMovie(bubble.slug, {});
		expectStatus(resp, body).toBe(200);
		expect(body.watchStatus).toMatchObject({
			percent: 100,
			status: "completed",
			completedAt: "2025-02-02T00:00:00.000Z",
		});

		[resp, body] = await getNextup("me", {});
		expectStatus(resp, body).toBe(200);
		expect(body.items).toBeArrayOfSize(1);
		expect(body.items[0].slug).toBe(miaEntrySlug);
		expect(body.items[0].progress).toMatchObject({
			percent: 58,
			time: 28 * 60 + 12,
			videoId: madeInAbyssVideo.id,
			playedDate: "2025-02-01T00:00:00.000Z",
		});
	});

	it("history completed picks next", async () => {
		let [resp, body] = await addToHistory("me", [
			{
				entry: miaEntrySlug,
				videoId: madeInAbyssVideo.id,
				percent: 98,
				time: 28 * 60 + 12,
				playedDate: new Date("2025-02-05"),
			},
		]);
		expectStatus(resp, body).toBe(201);
		expect(body.inserted).toBe(1);

		[resp, body] = await getSerie(madeInAbyss.slug, {
			with: ["nextEntry"],
		});
		expectStatus(resp, body).toBe(200);
		expect(body.nextEntry).toBeObject();
		expect(body.nextEntry.slug).toBe(miaNextEntrySlug);
		expect(body.nextEntry.progress).toMatchObject({
			percent: 0,
			time: 0,
			videoId: null,
			playedDate: null,
		});

		[resp, body] = await getNextup("me", {});
		expectStatus(resp, body).toBe(200);
		expect(body.items).toBeArrayOfSize(1);
		expect(body.items[0].slug).toBe(miaNextEntrySlug);
	});

	it("history completed skips already watched entries", async () => {
		let [resp, body] = await addToHistory("me", [
			{
				entry: `${madeInAbyss.slug}-s2e1`,
				videoId: null,
				percent: 100,
				time: 24 * 60,
				playedDate: new Date("2025-02-06"),
			},
			{
				entry: `${madeInAbyss.slug}-s2e2`,
				videoId: null,
				percent: 100,
				time: 24 * 60,
				playedDate: new Date("2025-02-07"),
			},
		]);
		expectStatus(resp, body).toBe(201);

		[resp, body] = await getSerie(madeInAbyss.slug, {
			with: ["nextEntry"],
		});
		expectStatus(resp, body).toBe(200);
		expect(body.nextEntry).toBeObject();
		expect(body.nextEntry.slug).toBe(`${madeInAbyss.slug}-s2e3`);

		[resp, body] = await addToHistory("me", [
			{
				entry: miaNextEntrySlug,
				videoId: null,
				percent: 100,
				time: 105 * 60,
				playedDate: new Date("2025-02-08"),
			},
		]);
		expectStatus(resp, body).toBe(201);

		[resp, body] = await getSerie(madeInAbyss.slug, {
			with: ["nextEntry"],
		});
		expectStatus(resp, body).toBe(200);
		expect(body.nextEntry).toBeObject();
		expect(body.nextEntry.slug).toBe(`${madeInAbyss.slug}-s2e3`);
		expect(body.watchStatus).toMatchObject({ status: "watching" });
	});

	it("dropped shows are hidden from nextup", async () => {
		let [resp, body] = await setSerieStatus(madeInAbyss.slug, {
			status: "dropped",
			completedAt: null,
			score: null,
			startedAt: null,
		});
		expectStatus(resp, body).toBe(200);

		[resp, body] = await getNextup("me", {});
		expectStatus(resp, body).toBe(200);
		expect(body.items).toBeArrayOfSize(0);

		[resp, body] = await setSerieStatus(madeInAbyss.slug, {
			status: "watching",
			completedAt: null,
			score: null,
			startedAt: null,
		});
		expectStatus(resp, body).toBe(200);

		[resp, body] = await getNextup("me", {});
		expectStatus(resp, body).toBe(200);
		expect(body.items).toBeArrayOfSize(1);
		expect(body.items[0].slug).toBe(`${madeInAbyss.slug}-s2e3`);
	});
});
