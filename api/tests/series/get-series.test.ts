import { beforeAll, describe, expect, it } from "bun:test";
import { createSerie, getSerie } from "tests/helpers";
import { expectStatus } from "tests/utils";
import { db } from "~/db";
import { shows, videos } from "~/db/schema";
import { madeInAbyss, madeInAbyssVideo } from "~/models/examples";

beforeAll(async () => {
	await db.delete(videos);
	await db.delete(shows);
	await db.insert(videos).values(madeInAbyssVideo);
	await createSerie(madeInAbyss);
});

describe("Get series", () => {
	it("Invalid slug", async () => {
		const [resp, body] = await getSerie("sotneuhn", { langs: "en" });

		expectStatus(resp, body).toBe(404);
		expect(body).toMatchObject({
			status: 404,
			message: expect.any(String),
		});
	});
	it("With a valid entryCount/availableCount", async () => {
		const [resp, body] = await getSerie(madeInAbyss.slug, { langs: "en" });

		expectStatus(resp, body).toBe(200);
		expect(body.entriesCount).toBe(madeInAbyss.entries.length);
		expect(body.availableCount).toBe(1);
	});
	it("With firstEntry", async () => {
		const [resp, body] = await getSerie(madeInAbyss.slug, {
			langs: "en",
			with: ["firstEntry"],
		});

		expectStatus(resp, body).toBe(200);
		expect(body.firstEntry.slug).toBe("made-in-abyss-s1e13");
		expect(body.firstEntry.name).toBe(
			madeInAbyss.entries[0].translations.en.name,
		);
		expect(body.firstEntry.videos).toBeArrayOfSize(1);
		// check that it's an iso datetime
		console.log(body.createdAt);
		expect(body.createdAt).toMatch(
			/\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+Z/,
		);
		console.log(body.firstEntry.createdAt);
		expect(body.firstEntry.createdAt).toMatch(
			/\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+Z/,
		);
	});
});
