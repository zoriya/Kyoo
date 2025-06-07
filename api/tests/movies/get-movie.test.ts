import { beforeAll, describe, expect, it } from "bun:test";
import { expectStatus } from "tests/utils";
import { db } from "~/db";
import { shows, videos } from "~/db/schema";
import { bubble, bubbleVideo } from "~/models/examples";
import { createMovie, getMovie } from "../helpers";

let bubbleId = "";

beforeAll(async () => {
	await db.delete(shows);
	await db.delete(videos);
	await db.insert(videos).values(bubbleVideo);
	const [ret, body] = await createMovie(bubble);
	expect(ret.status).toBe(201);
	bubbleId = body.id;
});

describe("Get movie", () => {
	it("Invalid slug", async () => {
		const [resp, body] = await getMovie("sotneuhn", { langs: "en" });

		expectStatus(resp, body).toBe(404);
		expect(body).toMatchObject({
			status: 404,
			message: expect.any(String),
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
		expect(body.slug).toBe(bubble.slug);
		const lang = resp.headers.get("Content-Language");
		if (lang === "en") {
			expect(body.name).toBe(bubble.translations.en.name);
		} else if (lang === "ja") {
			expect(body.name).toBe(bubble.translations.ja.name);
		} else {
			expect(lang).toBe("en");
		}
	});
	it("Works without accept-language header", async () => {
		const [resp, body] = await getMovie(bubble.slug, { langs: undefined });

		expectStatus(resp, body).toBe(200);
		expect(body.slug).toBe(bubble.slug);
		const lang = resp.headers.get("Content-Language");
		if (lang === "en") {
			expect(body.name).toBe(bubble.translations.en.name);
		} else if (lang === "ja") {
			expect(body.name).toBe(bubble.translations.ja.name);
		} else {
			expect(lang).toBe("en");
		}
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
	it("With isAvailable", async () => {
		const [resp, body] = await getMovie(bubble.slug, {});

		expectStatus(resp, body).toBe(200);
		expect(body.isAvailable).toBe(true);
	});
	it("With isAvailable=false", async () => {
		await createMovie({
			...bubble,
			slug: "no-video",
			videos: [],
		});
		const [resp, body] = await getMovie("no-video", {});

		expectStatus(resp, body).toBe(200);
		expect(body.isAvailable).toBe(false);
	});

	it("with=translations", async () => {
		const [resp, body] = await getMovie(bubble.slug, {
			with: ["translations"],
		});

		expectStatus(resp, body).toBe(200);
		expect(body.translations).toMatchObject({
			en: { name: bubble.translations.en.name },
			ja: { name: bubble.translations.ja.name },
		});
	});
	it("with=translations,videos", async () => {
		const [resp, body] = await getMovie(bubble.slug, {
			with: ["translations", "videos"],
		});

		expectStatus(resp, body).toBe(200);
		expect(body.translations).toMatchObject({
			en: { name: bubble.translations.en.name },
			ja: { name: bubble.translations.ja.name },
		});
		expect(body.videos).toBeArrayOfSize(bubble.videos!.length);
		expect(body.videos[0]).toMatchObject({
			path: bubbleVideo.path,
			slug: bubble.slug,
			version: bubbleVideo.version,
			rendering: bubbleVideo.rendering,
			part: bubbleVideo.part,
		});
	});
});
