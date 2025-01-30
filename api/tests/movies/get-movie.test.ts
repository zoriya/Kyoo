import { beforeAll, describe, expect, it } from "bun:test";
import { expectStatus } from "tests/utils";
import { seedMovie } from "~/controllers/seed/movies";
import { bubble } from "~/models/examples";
import { getMovie } from "../helpers";

let bubbleId = "";

beforeAll(async () => {
	const ret = await seedMovie(bubble);
	if (!("status" in ret)) bubbleId = ret.id;
});

describe("Get movie", () => {
	it("Invalid slug", async () => {
		const [resp, body] = await getMovie("sotneuhn", { langs: "en" });

		expectStatus(resp, body).toBe(404);
		expect(body).toMatchObject({
			status: 404,
			message: "Movie not found",
		});
	});
	it("Retrive by slug", async () => {
		const [resp, body] = await getMovie(bubble.slug, { langs: "en" });

		expectStatus(resp, body).toBe(200);
		expect(body).toMatchObject({
			slug: bubble.slug,
			name: bubble.translations.en.name,
		});
	});
	it("Retrive by id", async () => {
		const [resp, body] = await getMovie(bubbleId, { langs: "en" });

		expectStatus(resp, body).toBe(200);
		expect(body).toMatchObject({
			id: bubbleId,
			slug: bubble.slug,
			name: bubble.translations.en.name,
		});
	});
	it("Get non available translation", async () => {
		const [resp, body] = await getMovie(bubble.slug, { langs: "fr" });

		expectStatus(resp, body).toBe(422);
		expect(body).toMatchObject({
			status: 422,
		});
	});
	it("Get first available language", async () => {
		const [resp, body] = await getMovie(bubble.slug, { langs: "fr,en" });

		expectStatus(resp, body).toBe(200);
		expect(body).toMatchObject({
			slug: bubble.slug,
			name: bubble.translations.en.name,
		});
		expect(resp.headers.get("Content-Language")).toBe("en");
	});
	it("Use language fallback", async () => {
		const [resp, body] = await getMovie(bubble.slug, { langs: "fr,pr,*" });

		expectStatus(resp, body).toBe(200);
		expect(body).toMatchObject({
			slug: bubble.slug,
			name: bubble.translations.en.name,
		});
		expect(resp.headers.get("Content-Language")).toBe("en");
	});
	it("Works without accept-language header", async () => {
		const [resp, body] = await getMovie(bubble.slug, { langs: undefined });

		expectStatus(resp, body).toBe(200);
		expect(body).toMatchObject({
			slug: bubble.slug,
			name: bubble.translations.en.name,
		});
		expect(resp.headers.get("Content-Language")).toBe("en");
	});
	it("Fallback if translations does not exist", async () => {
		const [resp, body] = await getMovie(bubble.slug, { langs: "en-au" });

		expectStatus(resp, body).toBe(200);
		expect(body).toMatchObject({
			slug: bubble.slug,
			name: bubble.translations.en.name,
		});
		expect(resp.headers.get("Content-Language")).toBe("en");
	});
	it("Prefer original", async () => {
		expect(bubble.translations.ja.logo).toBe(null);
		expect(bubble.translations.en.logo).not.toBe(null);

		const [resp, body] = await getMovie(bubble.slug, {
			langs: "en-au",
			preferOriginal: true,
		});

		expectStatus(resp, body).toBe(200);
		expect(body).toMatchObject({
			slug: bubble.slug,
			name: bubble.translations.en.name,
			poster: {
				source: bubble.translations.ja.poster,
			},
			thumbnail: {
				source: bubble.translations.ja.thumbnail,
			},
			banner: null,
			// we fallback to the translated value when the original is null.
			logo: { source: bubble.translations.en.logo },
		});
		expect(resp.headers.get("Content-Language")).toBe("en");
	});
});
