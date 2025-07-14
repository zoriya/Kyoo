import { beforeAll, describe, expect, it } from "bun:test";
import {
	createMovie,
	getMovie,
	getShows,
	getWatchlist,
	setMovieStatus,
} from "tests/helpers";
import { expectStatus } from "tests/utils";
import { db } from "~/db";
import { shows } from "~/db/schema";
import { bubble } from "~/models/examples";

beforeAll(async () => {
	await db.delete(shows);
	const [ret, body] = await createMovie(bubble);
	expectStatus(ret, body).toBe(201);
});

describe("Set & get watch status", () => {
	it("Creates watchlist entry", async () => {
		let [resp, body] = await getWatchlist("me", {});
		expectStatus(resp, body).toBe(200);
		expect(body.items).toBeArrayOfSize(0);

		const [r, b] = await setMovieStatus(bubble.slug, {
			status: "completed",
			completedAt: "2024-12-21",
			score: 85,
		});
		expectStatus(r, b).toBe(200);

		[resp, body] = await getWatchlist("me", {});
		expectStatus(resp, body).toBe(200);
		expect(body.items).toBeArrayOfSize(1);
		expect(body.items[0].slug).toBe(bubble.slug);
		expect(body.items[0].watchStatus).toMatchObject({
			status: "completed",
			completedAt: "2024-12-21T00:00:00Z",
			score: 85,
			percent: 100,
		});
	});

	it("Edit watchlist entry", async () => {
		let [resp, body] = await getWatchlist("me", {});
		expectStatus(resp, body).toBe(200);
		expect(body.items).toBeArrayOfSize(1);

		const [r, b] = await setMovieStatus(bubble.slug, {
			status: "rewatching",
			// we still need to specify all values
			completedAt: "2024-12-21",
			score: 85,
		});
		expectStatus(r, b).toBe(200);

		[resp, body] = await getWatchlist("me", {});
		expectStatus(resp, body).toBe(200);
		expect(body.items).toBeArrayOfSize(1);
		expect(body.items[0].slug).toBe(bubble.slug);
		expect(body.items[0].watchStatus).toMatchObject({
			status: "rewatching",
			completedAt: "2024-12-21T00:00:00Z",
			score: 85,
			percent: 0,
		});
	});

	it("Can filter watchlist", async () => {
		let [resp, body] = await getWatchlist("me", {
			filter: "watchStatus eq rewatching",
		});
		expectStatus(resp, body).toBe(200);
		expect(body.items).toBeArrayOfSize(1);
		expect(body.items[0].slug).toBe(bubble.slug);

		[resp, body] = await getWatchlist("me", {
			filter: "watchStatus eq completed",
		});
		expectStatus(resp, body).toBe(200);
		expect(body.items).toBeArrayOfSize(0);
	});

	it("Return watchstatus in /shows", async () => {
		const [resp, body] = await getShows({});
		expectStatus(resp, body).toBe(200);
		expect(body.items).toBeArrayOfSize(1);
		expect(body.items[0].slug).toBe(bubble.slug);
		expect(body.items[0].watchStatus).toMatchObject({
			status: "rewatching",
			completedAt: "2024-12-21T00:00:00Z",
			score: 85,
			percent: 0,
		});
	});

	it("Return watchstatus in /movies/:id", async () => {
		const [r, b] = await setMovieStatus(bubble.slug, {
			status: "rewatching",
			// we still need to specify all values
			completedAt: "2024-12-21",
			score: 85,
		});
		expectStatus(r, b).toBe(200);

		const [resp, body] = await getMovie(bubble.slug, {});
		expectStatus(resp, body).toBe(200);
		expect(body.slug).toBe(bubble.slug);
		expect(body.watchStatus).toMatchObject({
			status: "rewatching",
			completedAt: "2024-12-21T00:00:00Z",
			score: 85,
			percent: 0,
		});
	});
});
