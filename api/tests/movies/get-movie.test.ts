import { beforeAll, describe, expect, it } from "bun:test";
import { seedMovie } from "~/controllers/seed/movies";
import { bubble } from "~/models/examples";
import { getMovie } from "./movies-helper";
import { expectStatus } from "tests/utils";

let bubbleId = "";

beforeAll(async () => {
	const ret = await seedMovie(bubble);
	if (ret.status !== 422) bubbleId = ret.id;
});

describe("Get movie", () => {
	it("Retrive by slug", async () => {
		const [resp, body] = await getMovie(bubble.slug, "en");

		expectStatus(resp, body).toBe(200);
		expect(body).toMatchObject({
			slug: bubble.slug,
			name: bubble.translations.en.name,
		});
	});
	it("Retrive by id", async () => {
		const [resp, body] = await getMovie(bubbleId, "en");

		expectStatus(resp, body).toBe(200);
		expect(body).toMatchObject({
			id: bubbleId,
			slug: bubble.slug,
			name: bubble.translations.en.name,
		});
	});
	it("Get non available translation", async () => {
		const [resp, body] = await getMovie(bubble.slug, "fr");

		expectStatus(resp, body).toBe(422);
		expect(body).toMatchObject({
			status: 422,
		});
	});
	it("Get first available language", async () => {
		const [resp, body] = await getMovie(bubble.slug, "fr,en");

		expectStatus(resp, body).toBe(200);
		expect(body).toMatchObject({
			slug: bubble.slug,
			name: bubble.translations.en.name,
		});
		expect(resp.headers.get("Content-Language")).toBe("en");
	});
	it("Use language fallback", async () => {
		const [resp, body] = await getMovie(bubble.slug, "fr,ja,*");

		expectStatus(resp, body).toBe(200);
		expect(body).toMatchObject({
			slug: bubble.slug,
			name: bubble.translations.en.name,
		});
		expect(resp.headers.get("Content-Language")).toBe("en");
	});
	it("Works without accept-language header", async () => {
		const [resp, body] = await getMovie(bubble.slug, undefined);

		expectStatus(resp, body).toBe(200);
		expect(body).toMatchObject({
			slug: bubble.slug,
			name: bubble.translations.en.name,
		});
		expect(resp.headers.get("Content-Language")).toBe("en");
	});
	it("Fallback if translations does not exist", async () => {
		const [resp, body] = await getMovie(bubble.slug, "en-au");

		expectStatus(resp, body).toBe(200);
		expect(body).toMatchObject({
			slug: bubble.slug,
			name: bubble.translations.en.name,
		});
		expect(resp.headers.get("Content-Language")).toBe("en");
	});
});
