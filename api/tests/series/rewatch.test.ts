import { beforeAll, describe, expect, it } from "bun:test";
import {
	addToHistory,
	createSerie,
	getNextup,
	getSerie,
	setSerieStatus,
} from "tests/helpers";
import { expectStatus } from "tests/utils";
import { db } from "~/db";
import { entries, shows, videos } from "~/db/schema";
import { madeInAbyss } from "~/models/examples";

beforeAll(async () => {
	await db.delete(shows);
	await db.delete(entries);
	await db.delete(videos);
	const [ret, body] = await createSerie(madeInAbyss);
	expectStatus(ret, body).toBe(201);
});

const story = [
	`${madeInAbyss.slug}-s1e13`,
	"made-in-abyss-dawn-of-the-deep-soul",
	`${madeInAbyss.slug}-s2e1`,
	`${madeInAbyss.slug}-s2e2`,
	`${madeInAbyss.slug}-s2e3`,
	`${madeInAbyss.slug}-s2e4`,
];

// `day` null means now (the rewatch start is set to now() so rewatch history must be after it)
const watch = async (entry: string, percent: number, day: number | null) => {
	const [resp, body] = await addToHistory("me", [
		{
			entry,
			videoId: null,
			percent,
			time: 60,
			playedDate: day === null ? null : new Date(Date.UTC(2025, 2, day)),
		},
	]);
	expectStatus(resp, body).toBe(201);
	const [r, b] = await getSerie(madeInAbyss.slug, { with: ["nextEntry"] });
	expectStatus(r, b).toBe(200);
	return b;
};

describe("rewatch", () => {
	it("first watch completes the serie", async () => {
		let body: any;
		for (const [i, entry] of story.entries()) {
			body = await watch(entry, 100, i + 1);
			if (i < story.length - 1) {
				expect(body.watchStatus.status).toBe("watching");
				expect(body.nextEntry.slug).toBe(story[i + 1]);
			}
		}
		expect(body.watchStatus).toMatchObject({
			status: "completed",
			seenCount: story.length,
		});
		expect(body.nextEntry).toBeNull();
	});

	it("marking as rewatching resets progress", async () => {
		const [r, b] = await setSerieStatus(madeInAbyss.slug, {
			status: "rewatching",
			score: null,
			startedAt: null,
			completedAt: null,
		});
		expectStatus(r, b).toBe(200);

		const [resp, body] = await getSerie(madeInAbyss.slug, {
			with: ["nextEntry"],
		});
		expectStatus(resp, body).toBe(200);
		expect(body.watchStatus).toMatchObject({
			status: "rewatching",
			seenCount: 0,
		});
		expect(body.nextEntry.slug).toBe(story[0]);
		expect(body.nextEntry.progress).toMatchObject({ percent: 0, time: 0 });

		const [nr, nb] = await getNextup("me", {});
		expectStatus(nr, nb).toBe(200);
		expect(nb.items).toBeArrayOfSize(1);
		expect(nb.items[0].slug).toBe(story[0]);
		expect(nb.items[0].progress).toMatchObject({ percent: 0, time: 0 });
	});

	it("partial watch keeps rewatching", async () => {
		const body = await watch(story[0], 50, null);
		expect(body.watchStatus).toMatchObject({
			status: "rewatching",
			seenCount: 1,
		});
		expect(body.nextEntry.slug).toBe(story[0]);
		expect(body.nextEntry.progress).toMatchObject({ percent: 50 });
	});

	it("rewatch skips entries already rewatched", async () => {
		// rewatch s2e1 out of order, s2e2 & s2e3 were only seen during the first watch
		let body = await watch(story[2], 100, null);
		expect(body.watchStatus).toMatchObject({
			status: "rewatching",
			seenCount: 2,
		});
		expect(body.nextEntry.slug).toBe(story[3]);
		expect(body.nextEntry.progress).toMatchObject({ percent: 0, time: 0 });

		body = await watch(story[0], 100, null);
		expect(body.nextEntry.slug).toBe(story[1]);

		body = await watch(story[1], 100, null);
		expect(body.watchStatus).toMatchObject({
			status: "rewatching",
			seenCount: 3,
		});
		expect(body.nextEntry.slug).toBe(story[3]);
	});

	it("rewatch completes", async () => {
		let body = await watch(story[3], 100, null);
		expect(body.nextEntry.slug).toBe(story[4]);
		body = await watch(story[4], 100, null);
		expect(body.nextEntry.slug).toBe(story[5]);
		body = await watch(story[5], 100, null);
		expect(body.watchStatus).toMatchObject({
			status: "completed",
			seenCount: story.length,
		});
		expect(body.nextEntry).toBeNull();
	});
});
