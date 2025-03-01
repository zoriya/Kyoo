import { beforeAll, describe, expect, it } from "bun:test";
import { getSeasons } from "tests/helpers";
import { expectStatus } from "tests/utils";
import { seedSerie } from "~/controllers/seed/series";
import { madeInAbyss } from "~/models/examples";

let miaId = "";

beforeAll(async () => {
	const ret = await seedSerie(madeInAbyss);
	if (!("status" in ret)) miaId = ret.id;
});

describe("Get seasons", () => {
	it("Invalid slug", async () => {
		const [resp, body] = await getSeasons("sotneuhn", { langs: "en" });

		expectStatus(resp, body).toBe(404);
		expect(body).toMatchObject({
			status: 404,
			message: expect.any(String),
		});
	});
	it("Default sort order", async () => {
		const [resp, body] = await getSeasons(madeInAbyss.slug, { langs: "en" });

		expectStatus(resp, body).toBe(200);
		expect(body.items).toBeArrayOfSize(madeInAbyss.seasons.length);
	});
});
