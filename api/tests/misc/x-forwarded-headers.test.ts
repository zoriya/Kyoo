import { beforeAll, describe, expect, it } from "bun:test";
import { getJwtHeaders } from "tests/helpers/jwt";
import { expectStatus } from "tests/utils";
import { db } from "~/db";
import { shows } from "~/db/schema";
import { bubble } from "~/models/examples";
import { dune1984 } from "~/models/examples/dune-1984";
import { dune } from "~/models/examples/dune-2021";
import { createMovie, getMovies, handlers } from "../helpers";

beforeAll(async () => {
	await db.delete(shows);
	for (const movie of [bubble, dune1984, dune]) {
		const [ret, _] = await createMovie(movie);
		expect(ret.status).toBe(201);
	}
});

describe("X-Forwarded-Proto header support", () => {
	it("Pagination URLs use HTTPS when X-Forwarded-Proto is https", async () => {
		const resp = await handlers.handle(
			new Request("http://localhost/api/movies?limit=2", {
				headers: {
					...(await getJwtHeaders()),
					"x-forwarded-proto": "https",
				},
			}),
		);
		const body = await resp.json();

		expectStatus(resp, body).toBe(200);
		expect(body).toMatchObject({
			items: expect.any(Array),
			this: "https://localhost/api/movies?limit=2",
			next: expect.stringContaining("https://localhost/api/movies?limit=2"),
		});
	});

	it("Pagination URLs use HTTP when no X-Forwarded-Proto header", async () => {
		const [resp, body] = await getMovies({
			limit: 2,
			langs: "en",
		});

		expectStatus(resp, body).toBe(200);
		expect(body).toMatchObject({
			items: expect.any(Array),
			this: "http://localhost/api/movies?limit=2",
			next: expect.stringContaining("http://localhost/api/movies?limit=2"),
		});
	});

	it("X-Forwarded-Host header changes the host in pagination URLs", async () => {
		const resp = await handlers.handle(
			new Request("http://localhost/api/movies?limit=2", {
				headers: {
					...(await getJwtHeaders()),
					"x-forwarded-proto": "https",
					"x-forwarded-host": "kyoo.example.com",
				},
			}),
		);
		const body = await resp.json();

		expectStatus(resp, body).toBe(200);
		expect(body).toMatchObject({
			items: expect.any(Array),
			this: "https://kyoo.example.com/api/movies?limit=2",
			next: expect.stringContaining(
				"https://kyoo.example.com/api/movies?limit=2",
			),
		});
	});

	it("Second page of pagination respects X-Forwarded headers", async () => {
		let resp = await handlers.handle(
			new Request("http://localhost/api/movies?limit=2", {
				headers: {
					...(await getJwtHeaders()),
					"x-forwarded-proto": "https",
					"x-forwarded-host": "kyoo.example.com",
				},
			}),
		);
		let body = await resp.json();

		expectStatus(resp, body).toBe(200);
		expect(body.next).toBeTruthy();
		expect(body.next).toContain("https://kyoo.example.com");

		// Follow the next link with the same headers
		resp = await handlers.handle(
			new Request(body.next, {
				headers: {
					...(await getJwtHeaders()),
					"x-forwarded-proto": "https",
					"x-forwarded-host": "kyoo.example.com",
				},
			}),
		);
		body = await resp.json();

		expectStatus(resp, body).toBe(200);
		expect(body.this).toContain("https://kyoo.example.com");
	});
});
