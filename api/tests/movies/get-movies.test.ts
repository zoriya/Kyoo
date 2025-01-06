import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { eq } from "drizzle-orm";
import Elysia from "elysia";
import { base } from "~/base";
import { movies } from "~/controllers/movies";
import { seedMovie } from "~/controllers/seed/movies";
import { db } from "~/db";
import { shows } from "~/db/schema";
import { bubble } from "~/models/examples";

const app = new Elysia().use(base).use(movies);
const getMovie = async (id: string, langs?: string) => {
	const resp = await app.handle(
		new Request(`http://localhost/movies/${id}`, {
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
const getMovies = async ({
	langs,
	...query
}: { filter?: string; langs?: string }) => {
	// const params = Object.entries(query).reduce(
	// 	(acc, [param, value]) => `${param}=${value}&`,
	// 	"?",
	// );
	const resp = await app.handle(
		new Request(
			`http://localhost/movies?${new URLSearchParams(query).toString()}`,
			{
				method: "GET",
				headers: langs
					? {
							"Accept-Language": langs,
						}
					: {},
			},
		),
	);
	const body = await resp.json();
	return [resp, body] as const;
};

let bubbleId = "";

function expectStatus(resp: Response, body: object) {
	const matcher = expect({ ...body, status: resp.status });
	return {
		toBe: (status: number) => {
			matcher.toMatchObject({ status: status });
		},
	};
}

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
});

beforeAll(async () => {
	const ret = await seedMovie(bubble);
	bubbleId = ret.id;
});
afterAll(async () => {
	await db.delete(shows).where(eq(shows.slug, bubble.slug));
});
