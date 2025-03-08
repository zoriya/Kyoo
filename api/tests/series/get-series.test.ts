import { beforeAll, describe, expect, it } from "bun:test";
import { createSerie, getSerie } from "tests/helpers";
import { expectStatus } from "tests/utils";
import { madeInAbyss } from "~/models/examples";

beforeAll(async () => {
	await createSerie(madeInAbyss);
});

describe("Get seasons", () => {
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

		console.log(body)
		expectStatus(resp, body).toBe(200);
		expect(body.entriesCount).toBe(madeInAbyss.entries.length);
		expect(body.availableCount).toBe(1);
	});
});
