import { beforeAll, describe, expect, it } from "bun:test";
import {
	createSerie,
	createVideo,
	getEntries,
	getExtras,
	getNews,
} from "tests/helpers";
import { expectStatus } from "tests/utils";
import { db } from "~/db";
import { shows, videos } from "~/db/schema";
import { madeInAbyss as base, madeInAbyssVideo } from "~/models/examples";

// make a copy so we can mutate it.
const madeInAbyss = JSON.parse(JSON.stringify(base)) as typeof base;

beforeAll(async () => {
	await db.delete(shows);
	await db.delete(videos);
	const [_, vid] = await createVideo(madeInAbyssVideo);
	for (const entry of madeInAbyss.entries.filter((x) => x.videos?.length))
		entry.videos = [vid[0].id];
	for (const entry of madeInAbyss.extras.filter((x) => x.video))
		entry.video = vid[0].id;
	await createSerie(madeInAbyss);
});

describe("Get entries", () => {
	it("Invalid slug", async () => {
		const [resp, body] = await getEntries("sotneuhn", { langs: "en" });

		expectStatus(resp, body).toBe(404);
		expect(body).toMatchObject({
			status: 404,
			message: expect.any(String),
		});
	});
	it("Default sort order", async () => {
		const [resp, body] = await getEntries(madeInAbyss.slug, { langs: "en" });

		expectStatus(resp, body).toBe(200);
		expect(body.items).toBeArrayOfSize(madeInAbyss.entries.length);
	});
	it("With videos", async () => {
		const [resp, body] = await getEntries(madeInAbyss.slug, { langs: "en" });

		expectStatus(resp, body).toBe(200);
		expect(body.items[0].videos).toBeArrayOfSize(1);
		expect(body.items[0].videos[0]).toMatchObject({
			path: madeInAbyssVideo.path,
			slug: `${madeInAbyss.slug}-s1e13`,
			version: madeInAbyssVideo.version,
			rendering: madeInAbyssVideo.rendering,
			part: madeInAbyssVideo.part,
		});
	});
	it("Get new videos", async () => {
		const [resp, body] = await getNews({ langs: "en" });

		expectStatus(resp, body).toBe(200);
		expect(body.items).toBeArrayOfSize(1);
		expect(body.items[0].slug).toBe("made-in-abyss-s1e13");
		expect(body.items[0].videos).toBeArrayOfSize(1);
		expect(body.items[0].videos[0]).toMatchObject({
			path: madeInAbyssVideo.path,
			slug: `${madeInAbyss.slug}-s1e13`,
			version: madeInAbyssVideo.version,
			rendering: madeInAbyssVideo.rendering,
			part: madeInAbyssVideo.part,
		});
	});
});

describe("Get extra", () => {
	it("Invalid slug", async () => {
		const [resp, body] = await getExtras("sotneuhn", {});

		expectStatus(resp, body).toBe(404);
		expect(body).toMatchObject({
			status: 404,
			message: expect.any(String),
		});
	});
	it("Default sort order", async () => {
		const [resp, body] = await getExtras(madeInAbyss.slug, {});

		expectStatus(resp, body).toBe(200);
		expect(body.items).toBeArrayOfSize(madeInAbyss.extras.length);
	});
});
