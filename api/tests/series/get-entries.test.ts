import { beforeAll, describe, expect, it } from "bun:test";
import { createSerie, createVideo, getEntries, getExtras } from "tests/helpers";
import { expectStatus } from "tests/utils";
import { db } from "~/db";
import { shows, videos } from "~/db/schema";
import { madeInAbyss, madeInAbyssVideo } from "~/models/examples";

beforeAll(async () => {
	await db.delete(shows);
	await db.delete(videos);
	console.log(await createVideo(madeInAbyssVideo));
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
