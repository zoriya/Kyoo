import { afterAll, beforeAll, describe, expect, it, test } from "bun:test";
import { eq, inArray } from "drizzle-orm";
import Elysia from "elysia";
import { base } from "~/base";
import { seed } from "~/controllers/seed";
import { db } from "~/db";
import { shows, showTranslations, videos } from "~/db/schema";
import { bubble } from "~/models/examples";
import { dune, duneVideo } from "~/models/examples/dune-2021";
import type { SeedMovie } from "~/models/movie";

const app = new Elysia().use(base).use(seed);
const createMovie = async (movie: SeedMovie) => {
	const resp = await app.handle(
		new Request("http://localhost/movies", {
			method: "POST",
			body: JSON.stringify(movie),
			headers: {
				"Content-Type": "application/json",
			},
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

describe("Movie seeding", () => {
	it("Can create a movie", async () => {
		// create video beforehand to test linking
		await db.insert(videos).values(duneVideo);

		const [resp, body] = await createMovie(dune);
		expectStatus(resp, body).toBe(201);
		expect(body.id).toBeString();
		expect(body.slug).toBe("dune");
		expect(body.videos).toContainEqual({ slug: "dune" });
	});

	it("Update existing movie", async () => {
		// confirm that db is in the correct state (from previous tests)
		const [existing] = await db
			.select()
			.from(shows)
			.where(eq(shows.slug, dune.slug))
			.limit(1);
		expect(existing).toMatchObject({ slug: dune.slug, startAir: dune.airDate });

		const [resp, body] = await createMovie({
			...dune,
			runtime: 200_000,
			translations: {
				...dune.translations,
				en: { ...dune.translations.en, description: "edited translation" },
				fr: {
					name: "dune-but-in-french",
					description: null,
					tagline: null,
					aliases: [],
					tags: [],
					poster: null,
					thumbnail: null,
					banner: null,
					logo: null,
					trailerUrl: null,
				},
			},
		});
		const [edited] = await db
			.select()
			.from(shows)
			.where(eq(shows.slug, dune.slug))
			.limit(1);
		const translations = await db
			.select()
			.from(showTranslations)
			.where(eq(showTranslations.pk, edited.pk));

		expectStatus(resp, body).toBe(200);
		expect(body.id).toBeString();
		expect(body.slug).toBe("dune");
		expect(body.videos).toBeArrayOfSize(0);
		expect(edited.runtime).toBe(200_000);
		expect(edited.status).toBe(dune.status);
		expect(translations.find((x) => x.language === "en")).toMatchObject({
			name: dune.translations.en.name,
			description: "edited translation",
		});
		expect(translations.find((x) => x.language === "fr")).toMatchObject({
			name: "dune-but-in-french",
			description: null,
		});
	});

	it("Conflicting slug auto-correct", async () => {
		// confirm that db is in the correct state (from previous tests)
		const [existing] = await db
			.select()
			.from(shows)
			.where(eq(shows.slug, dune.slug))
			.limit(1);
		expect(existing).toMatchObject({ slug: dune.slug, startAir: dune.airDate });

		const [resp, body] = await createMovie({ ...dune, airDate: "2158-12-13" });
		expectStatus(resp, body).toBe(200);
		expect(body.id).toBeString();
		expect(body.slug).toBe("dune-2158");
	});

	it("Conflict in slug w/out year fails", async () => {
		// confirm that db is in the correct state (from conflict auto-correct test)
		const [existing] = await db
			.select()
			.from(shows)
			.where(eq(shows.slug, dune.slug))
			.limit(1);
		expect(existing).toMatchObject({ slug: dune.slug, startAir: dune.airDate });

		const [resp, body] = await createMovie({ ...dune, airDate: null });
		expectStatus(resp, body).toBe(409);
		expect(body.id).toBe(existing.id);
		expect(body.slug).toBe(existing.slug);
	});

	it("Missing videos send info", async () => {
		const vid = "a0ddf0ce-3258-4452-a670-aff36c76d524";
		const [existing] = await db
			.select()
			.from(videos)
			.where(eq(videos.id, vid))
			.limit(1);
		expect(existing).toBeUndefined();

		const [resp, body] = await createMovie({
			...dune,
			videos: [vid],
		});

		expectStatus(resp, body).toBe(200);
		expect(body.videos).toBeArrayOfSize(0);
	});

	it("Schema error (missing fields)", async () => {
		const [resp, body] = await createMovie({
			name: "dune",
		} as any);

		expectStatus(resp, body).toBe(422);
		expect(body.status).toBe(422);
		expect(body.message).toBeString();
		expect(body.details).toBeObject();
		// TODO: handle additional fields too
	});

	it("Invalid translation name", async () => {
		const [resp, body] = await createMovie({
			...dune,
			translations: {
				...dune.translations,
				test: {
					name: "foo",
					description: "bar",
					tags: [],
					aliases: [],
					tagline: "toto",
					banner: null,
					poster: null,
					thumbnail: null,
					logo: null,
					trailerUrl: null,
				},
			},
		});

		expectStatus(resp, body).toBe(400);
		expect(body.status).toBe(400);
		expect(body.message).toBe("Invalid translation name: 'test'.");
	});

	it("Correct translations casing.", async () => {
		const [resp, body] = await createMovie({
			...bubble,
			slug: "casing-test",
			translations: {
				"en-us": {
					name: "foo",
					description: "bar",
					tags: [],
					aliases: [],
					tagline: "toto",
					banner: null,
					poster: null,
					thumbnail: null,
					logo: null,
					trailerUrl: null,
				},
			},
		});

		expect(resp.status).toBeWithin(200, 299);
		expect(body.id).toBeString();
		const ret = await db.query.shows.findFirst({
			where: eq(shows.id, body.id),
			with: { translations: true },
		});
		expect(ret!.translations).toBeArrayOfSize(1);
		expect(ret!.translations[0]).toMatchObject({
			language: "en-US",
			name: "foo",
		});
	});

	test.todo("Create correct video slug (version)", async () => {});
	test.todo("Create correct video slug (part)", async () => {});
	test.todo("Create correct video slug (rendering)", async () => {});
});

const cleanup = async () => {
	await db.delete(shows).where(inArray(shows.slug, [dune.slug]));
	await db.delete(videos).where(inArray(videos.id, [duneVideo.id]));
};
// cleanup db beforehand to unsure tests are consistent
beforeAll(cleanup);
afterAll(cleanup);
