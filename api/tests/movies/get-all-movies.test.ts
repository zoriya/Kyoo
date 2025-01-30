import { beforeAll, describe, expect, it } from "bun:test";
import { expectStatus } from "tests/utils";
import { seedMovie } from "~/controllers/seed/movies";
import { db } from "~/db";
import { shows } from "~/db/schema";
import { bubble } from "~/models/examples";
import { dune1984 } from "~/models/examples/dune-1984";
import { dune } from "~/models/examples/dune-2021";
import type { Movie } from "~/models/movie";
import { isUuid } from "~/models/utils";
import { app, getMovies } from "../helpers";

beforeAll(async () => {
	await db.delete(shows);
	for (const movie of [bubble, dune1984, dune]) await seedMovie(movie);
});

describe("Get all movies", () => {
	it("Invalid filter params", async () => {
		const [resp, body] = await getMovies({
			filter: `slug eq ${bubble.slug}`,
			langs: "en",
		});

		expectStatus(resp, body).toBe(422);
		expect(body).toMatchObject({
			status: 422,
			message: expect.any(String),
			details: {
				in: "slug eq bubble",
			},
		});
	});
	it("Invalid filter syntax", async () => {
		const [resp, body] = await getMovies({
			filter: `slug eq gt ${bubble.slug}`,
			langs: "en",
		});

		expectStatus(resp, body).toBe(422);
		expect(body).toMatchObject({
			details: expect.anything(),
			message: "Invalid filter: slug eq gt bubble.",
			status: 422,
		});
	});
	it("Limit 2, default sort", async () => {
		const [resp, body] = await getMovies({
			limit: 2,
			langs: "en",
		});

		expectStatus(resp, body).toBe(200);
		expect(body).toMatchObject({
			items: [
				expect.objectContaining({ slug: bubble.slug }),
				expect.objectContaining({ slug: dune.slug }),
			],
			this: "http://localhost/movies?limit=2",
			// we can't have the exact after since it contains the pk that changes with every tests.
			next: expect.stringContaining(
				"http://localhost/movies?limit=2&after=WyJkdW5lIiw",
			),
		});
	});
	it("Limit 2, default sort, page 2", async () => {
		let [resp, body] = await getMovies({
			limit: 2,
			langs: "en",
		});
		expectStatus(resp, body).toBe(200);

		resp = await app.handle(new Request(body.next));
		body = await resp.json();

		expectStatus(resp, body).toBe(200);
		expect(body).toMatchObject({
			items: [expect.objectContaining({ slug: dune1984.slug })],
			this: expect.stringContaining(
				"http://localhost/movies?limit=2&after=WyJkdW5lIiw",
			),
			next: null,
		});
	});
	it("Limit 2, sort by dates desc, page 2", async () => {
		let [resp, body] = await getMovies({
			limit: 2,
			sort: "-airDate",
			langs: "en",
		});
		expectStatus(resp, body).toBe(200);

		// we copy this due to https://github.com/oven-sh/bun/issues/3521
		const next = body.next;
		expect(body).toMatchObject({
			items: [
				expect.objectContaining({ slug: bubble.slug, airDate: bubble.airDate }),
				expect.objectContaining({ slug: dune.slug, airDate: dune.airDate }),
			],
			this: "http://localhost/movies?limit=2&sort=-airDate",
			next: expect.stringContaining(
				"http://localhost/movies?limit=2&sort=-airDate&after=WyIyMDIxLTEwLTIyIiw",
			),
		});

		resp = await app.handle(new Request(next));
		body = await resp.json();

		expectStatus(resp, body).toBe(200);
		expect(body).toMatchObject({
			items: [
				expect.objectContaining({
					slug: dune1984.slug,
					airDate: dune1984.airDate,
				}),
			],
			this: next,
			next: null,
		});
	});

	describe("Random sort", () => {
		it("No limit, compare order with same seeds", async () => {
			// First query
			const [resp1, body1] = await getMovies({
				sort: "random:100",
			});
			expectStatus(resp1, body1).toBe(200);
			const items1: Movie[] = body1.items;
			const items1Ids = items1.map(({ id }) => id);

			// Second query
			const [resp2, body2] = await getMovies({
				sort: "random:100",
			});
			expectStatus(resp2, body2).toBe(200);
			const items2: Movie[] = body2.items;
			const items2Ids = items2.map(({ id }) => id);

			expect(items1Ids).toEqual(items2Ids);
		});
		it("Limit 1, pages 1 and 2 ", async () => {
			// First query fetches all
			// use the result to know what is expected
			let [resp, body] = await getMovies({
				sort: "random:1234",
			});
			expectStatus(resp, body).toBe(200);
			let items: Movie[] = body.items;
			const expectedIds = items.map(({ id }) => id);

			// Get First Page
			[resp, body] = await getMovies({
				sort: "random:1234",
				limit: 1,
			});
			expectStatus(resp, body).toBe(200);
			items = body.items;
			expect(items.length).toBe(1);
			expect(items[0].id).toBe(expectedIds[0]);
			// Get Second Page
			resp = await app.handle(new Request(body.next));
			body = await resp.json();

			expectStatus(resp, body).toBe(200);
			items = body.items;
			expect(items.length).toBe(1);
			expect(items[0].id).toBe(expectedIds[1]);
		});
		it("Limit 1, pages 1 and 2, no seed ", async () => {
			const [resp, body] = await getMovies({
				sort: "random",
				limit: 2,
			});
			expectStatus(resp, body).toBe(200);

			const resp2 = await app.handle(new Request(body.next));
			const body2 = await resp2.json();
			expectStatus(resp2, body).toBe(200);

			expect(body2.items.length).toBe(1);
			expect(body.items.map((x: Movie) => x.slug)).not.toContain(
				body2.items[0].slug,
			);
		});

		it("Get /random", async () => {
			const resp = await app.handle(
				new Request("http://localhost/movies/random"),
			);
			expect(resp.status).toBe(302);
			const location = resp.headers.get("location")!;
			expect(location).toStartWith("/movies/");
			const id = location.substring("/movies/".length);
			expect(isUuid(id)).toBe(true);
		});
	});
	it("Limit 2, fallback lang, prefer original", async () => {
		const [resp, body] = await getMovies({
			limit: 2,
			langs: "en-au",
			preferOriginal: true,
		});

		expectStatus(resp, body).toBe(200);
		expect(body.items[0]).toMatchObject({
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
		expect(body.items[1]).toMatchObject({
			slug: dune.slug,
			name: dune.translations.en.name,
		});
	});
	it("Limit 2, * lang, prefer original", async () => {
		const [resp, body] = await getMovies({
			limit: 2,
			langs: "*",
			preferOriginal: true,
		});

		expectStatus(resp, body).toBe(200);
		expect(body.items[0]).toMatchObject({
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
		expect(body.items[1]).toMatchObject({
			slug: dune.slug,
			name: dune.translations.en.name,
		});
	});
	it("Limit 2, unknown lang, prefer original", async () => {
		const [resp, body] = await getMovies({
			limit: 2,
			langs: "toto",
			preferOriginal: true,
		});

		expectStatus(resp, body).toBe(200);
		expect(body.items[0]).toMatchObject({
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
		expect(body.items[1]).toMatchObject({
			slug: dune.slug,
			name: dune.translations.en.name,
		});
	});
	it("Filter with tags", async () => {
		const [resp, body] = await getMovies({
			limit: 2,
			filter: "tags eq gravity",
		});

		expectStatus(resp, body).toBe(200);
		expect(body.items).toBeArrayOfSize(1);
		expect(body.items[0].slug).toBe(bubble.slug);
	});
});

describe("search", () => {
	it("Partial match", async () => {
		const [resp, body] = await getMovies({
			limit: 2,
			query: "bub",
		});

		expectStatus(resp, body).toBe(200);
		expect(body.items).toBeArrayOfSize(1);
		expect(body.items[0].slug).toBe(bubble.slug);
	});
	it("Invalid search don't match", async () => {
		const [resp, body] = await getMovies({
			limit: 2,
			query: "buboeuoeunhoeu",
		});

		expectStatus(resp, body).toBe(200);
		expect(body.items).toBeArrayOfSize(0);
	});
	it("Typo match", async () => {
		const [resp, body] = await getMovies({
			limit: 2,
			query: "bobble",
		});

		expectStatus(resp, body).toBe(200);
		expect(body.items).toBeArrayOfSize(1);
		expect(body.items[0].slug).toBe(bubble.slug);
	});
});
