import { beforeAll, describe, expect, it } from "bun:test";
import { expectStatus } from "tests/utils";
import { seedMovie } from "~/controllers/seed/movies";
import { db } from "~/db";
import { shows } from "~/db/schema";
import { bubble } from "~/models/examples";
import { dune1984 } from "~/models/examples/dune-1984";
import { dune } from "~/models/examples/dune-2021";
import { app, createMovie, getMovies } from "../helpers";

beforeAll(async () => {
	await db.delete(shows);
	for (const movie of [bubble, dune1984, dune]) await seedMovie(movie);
});

describe("with a null value", () => {
	// Those before/after hooks are NOT scoped to the describe due to a bun bug
	// instead we just make a new file for those /shrug
	// see: https://github.com/oven-sh/bun/issues/5738
	beforeAll(async () => {
		await createMovie({
			slug: "no-air-date",
			translations: {
				en: {
					name: "no air date",
					description: null,
					aliases: [],
					banner: null,
					logo: null,
					poster: null,
					tagline: null,
					tags: [],
					thumbnail: null,
					trailerUrl: null,
				},
			},
			genres: [],
			status: "unknown",
			rating: null,
			runtime: null,
			airDate: null,
			originalLanguage: null,
			externalId: {},
		});
	});

	it("sort by dates desc with a null value", async () => {
		let [resp, body] = await getMovies({
			limit: 2,
			sort: "-airDate",
			langs: "en",
		});
		expectStatus(resp, body).toBe(200);

		expect(body.items.map((x: any) => x.slug)).toMatchObject([
			bubble.slug,
			dune.slug,
		]);

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
		expect(body.items.map((x: any) => x.slug)).toMatchObject([
			dune1984.slug,
			"no-air-date",
		]);
		expect(body).toMatchObject({
			items: [
				expect.objectContaining({
					slug: dune1984.slug,
					airDate: dune1984.airDate,
				}),
				expect.objectContaining({
					slug: "no-air-date",
					airDate: null,
				}),
			],
			this: next,
			next: expect.anything(),
		});
	});
	it("sort by dates asc with a null value", async () => {
		let [resp, body] = await getMovies({
			limit: 2,
			sort: "airDate",
			langs: "en",
		});
		expectStatus(resp, body).toBe(200);

		// we copy this due to https://github.com/oven-sh/bun/issues/3521
		const next = body.next;
		expect(body).toMatchObject({
			items: [
				expect.objectContaining({
					slug: dune1984.slug,
					airDate: dune1984.airDate,
				}),
				expect.objectContaining({ slug: dune.slug, airDate: dune.airDate }),
			],
			this: "http://localhost/movies?limit=2&sort=airDate",
			next: expect.stringContaining(
				"http://localhost/movies?limit=2&sort=airDate&after=WyIyMDIxLTEwLTIyIiw",
			),
		});

		resp = await app.handle(new Request(next));
		body = await resp.json();

		expectStatus(resp, body).toBe(200);
		expect(body).toMatchObject({
			items: [
				expect.objectContaining({
					slug: bubble.slug,
					airDate: bubble.airDate,
				}),
				expect.objectContaining({
					slug: "no-air-date",
					airDate: null,
				}),
			],
			this: next,
			next: expect.anything(),
		});
	});
});
