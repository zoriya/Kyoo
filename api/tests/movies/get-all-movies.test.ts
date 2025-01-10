import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { expectStatus } from "tests/utils";
import { seedMovie } from "~/controllers/seed/movies";
import { db } from "~/db";
import { shows } from "~/db/schema";
import { bubble } from "~/models/examples";
import { dune1984 } from "~/models/examples/dune-1984";
import { dune } from "~/models/examples/dune-2021";
import { getMovies, movieApp } from "./movies-helper";

beforeAll(async () => {
	await db.delete(shows);
	for (const movie of [bubble, dune1984, dune]) await seedMovie(movie);
});
afterAll(async () => {
	await db.delete(shows);
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
			message:
				"Invalid property: slug. Expected one of genres, rating, status, runtime, airDate, originalLanguage.",
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

		resp = await movieApp.handle(new Request(body.next));
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

		resp = await movieApp.handle(new Request(next));
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
});
