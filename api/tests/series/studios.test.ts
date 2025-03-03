import { beforeAll, describe, expect, it } from "bun:test";
import { getShowsByStudio } from "tests/helpers/studio-helper";
import { expectStatus } from "tests/utils";
import { seedSerie } from "~/controllers/seed/series";
import { madeInAbyss } from "~/models/examples";

beforeAll(async () => {
	await seedSerie(madeInAbyss);
});

describe("Get by studio", () => {
	it("Invalid slug", async () => {
		const [resp, body] = await getShowsByStudio("sotneuhn", { langs: "en" });

		expectStatus(resp, body).toBe(404);
		expect(body).toMatchObject({
			status: 404,
			message: expect.any(String),
		});
	});
	it("Get serie from studio", async () => {
		const [resp, body] = await getShowsByStudio(madeInAbyss.studios[0].slug, {
			langs: "en",
		});

		expectStatus(resp, body).toBe(200);
		expect(body.items).toBeArrayOfSize(1);
		expect(body.items[0].slug).toBe(madeInAbyss.slug);
	});
});
