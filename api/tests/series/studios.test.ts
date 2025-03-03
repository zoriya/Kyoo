import { beforeAll, describe, expect, it } from "bun:test";
import { getSerie, getShowsByStudio, getStudio } from "tests/helpers";
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

describe("Get a studio", () => {
	it("Invalid slug", async () => {
		const [resp, body] = await getStudio("sotneuhn", { langs: "en" });

		expectStatus(resp, body).toBe(404);
		expect(body).toMatchObject({
			status: 404,
			message: expect.any(String),
		});
	});
	it("Get by id", async () => {
		const slug = madeInAbyss.studios[0].slug;
		const [resp, body] = await getStudio(slug, { langs: "en" });

		expectStatus(resp, body).toBe(200);
		expect(body.slug).toBe(slug);
	});
	it("Get using /shows?with=", async () => {
		const [resp, body] = await getSerie(madeInAbyss.slug, {
			langs: "en",
			with: ["studios"],
		});

		expectStatus(resp, body).toBe(200);
		expect(body.slug).toBe(madeInAbyss.slug);
		expect(body.studios).toBeArrayOfSize(1);
		const studio = madeInAbyss.studios[0];
		expect(body.studios[0]).toMatchObject({
			slug: studio.slug,
			name: studio.translations.en.name,
		});
	});
});
