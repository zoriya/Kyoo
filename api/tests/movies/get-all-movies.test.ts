import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { eq } from "drizzle-orm";
import Elysia from "elysia";
import { base } from "~/base";
import { movies } from "~/controllers/movies";
import { seedMovie } from "~/controllers/seed/movies";
import { db } from "~/db";
import { shows } from "~/db/schema";
import { bubble } from "~/models/examples";
import { dune1984 } from "~/models/examples/dune-1984";
import { dune } from "~/models/examples/dune-2021";

const app = new Elysia().use(base).use(movies);
const getMovies = async ({
	langs,
	...query
}: {
	filter?: string;
	limit?: number;
	after?: string;
	sort?: string[];
	langs?: string;
}) => {
	const params = new URLSearchParams();
	for (const [key, value] of Object.entries(query)) {
		if (!Array.isArray(value)) {
			params.append(key, value.toString());
			continue;
		}
		for (const v of value) params.append(key, v.toString());
	}

	const resp = await app.handle(
		new Request(`http://localhost/movies?${params}`, {
			method: "GET",
			headers: langs
				? {
						"Accept-Language": langs,
					}
				: {},
		}),
	);
	const body = await resp.json();
	return [resp, body] as const;
};

function expectStatus(resp: Response, body: object) {
	const matcher = expect({ ...body, status: resp.status });
	return {
		toBe: (status: number) => {
			matcher.toMatchObject({ status: status });
		},
	};
}

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
				"http://localhost/movies?limit=2&after=WyJkdW5lIiw0",
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
				"http://localhost/movies?limit=2&after=WyJkdW5lIiw0",
			),
			next: null,
		});
	});
});

beforeAll(async () => {
	await db.delete(shows);
	for (const movie of [bubble, dune1984, dune]) await seedMovie(movie);
});
afterAll(async () => {
	await db.delete(shows);
});
