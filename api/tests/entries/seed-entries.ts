import { beforeAll, describe, expect, it } from "bun:test";
import { eq } from "drizzle-orm";
import { expectStatus } from "tests/utils";
import { db } from "~/db";
import { showTranslations, shows, videos } from "~/db/schema";
import { bubble } from "~/models/examples";
import { dune, duneVideo } from "~/models/examples/dune-2021";
import { createMovie, createVideo } from "../helpers";

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
		expectStatus(resp, body).toBe(201);
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

		expectStatus(resp, body).toBe(422);
		expect(body.status).toBe(422);
		expect(body.message).toBe("Invalid translation name: 'test'.");
	});

	it("Correct translations casing.", async () => {
		const [resp, body] = await createMovie({
			...bubble,
			slug: "casing-test",
			originalLanguage: "jp-jp",
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
		expect(ret!.originalLanguage).toBe("jp-JP");
		expect(ret!.translations).toBeArrayOfSize(2);
		expect(ret!.translations).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					language: "en-US",
					name: "foo",
				}),
			]),
		);
		expect(ret!.translations).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					language: "en",
					name: "foo",
				}),
			]),
		);
	});

	it("Refuses random as a slug", async () => {
		const [resp, body] = await createMovie({
			...bubble,
			slug: "random",
			airDate: null,
		});
		expectStatus(resp, body).toBe(422);
	});
	it("Refuses random as a slug but fallback w/ airDate", async () => {
		const [resp, body] = await createMovie({ ...bubble, slug: "random" });
		expectStatus(resp, body).toBe(201);
		expect(body.slug).toBe("random-2022");
	});

	it("Handle fallback translations", async () => {
		const [resp, body] = await createMovie({
			...bubble,
			slug: "bubble-translation-test",
			translations: { "en-us": bubble.translations.en },
		});
		expectStatus(resp, body).toBe(201);

		const ret = await db.query.shows.findFirst({
			where: eq(shows.id, body.id),
			with: { translations: true },
		});
		expect(ret!.translations).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					name: bubble.translations.en.name,
					language: "en",
				}),
			]),
		);
		expect(ret!.translations).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					name: bubble.translations.en.name,
					language: "en-US",
				}),
			]),
		);
	});
	it("No fallback if explicit", async () => {
		const [resp, body] = await createMovie({
			...bubble,
			slug: "bubble-translation-test-2",
			translations: {
				"en-us": bubble.translations.en,
				"en-au": { ...bubble.translations.en, name: "australian thing" },
				en: { ...bubble.translations.en, name: "Generic" },
			},
		});
		expectStatus(resp, body).toBe(201);

		const ret = await db.query.shows.findFirst({
			where: eq(shows.id, body.id),
			with: { translations: true },
		});
		expect(ret!.translations).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					name: bubble.translations.en.name,
					language: "en-US",
				}),
			]),
		);
		expect(ret!.translations).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					name: "australian thing",
					description: bubble.translations.en.description,
					language: "en-AU",
				}),
			]),
		);
		expect(ret!.translations).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					name: "Generic",
					description: bubble.translations.en.description,
					language: "en",
				}),
			]),
		);
	});

	it("Create correct video slug", async () => {
		const [vresp, video] = await createVideo({
			path: "/video/bubble.mkv",
			part: null,
			version: 1,
			rendering: "oeunhtoeuth",
		});
		expectStatus(vresp, video).toBe(201);

		const [resp, body] = await createMovie({
			...bubble,
			slug: "video-slug-test1",
			videos: [video[0].id],
		});
		expectStatus(resp, body).toBe(201);

		const ret = await db.query.videos.findFirst({
			where: eq(videos.id, video[0].id),
			with: { evj: { with: { entry: true } } },
		});
		expect(ret).not.toBe(undefined);
		expect(ret!.evj).toBeArrayOfSize(1);
		expect(ret!.evj[0].slug).toBe("video-slug-test1");
	});

	it("Create correct video slug (version)", async () => {
		const [vresp, video] = await createVideo({
			path: "/video/bubble2.mkv",
			part: null,
			version: 2,
			rendering: "oeunhtoeuth",
		});
		expectStatus(vresp, video).toBe(201);

		const [resp, body] = await createMovie({
			...bubble,
			slug: "bubble-vtest",
			videos: [video[0].id],
		});
		expectStatus(resp, body).toBe(201);

		const ret = await db.query.videos.findFirst({
			where: eq(videos.id, video[0].id),
			with: { evj: { with: { entry: true } } },
		});
		expect(ret).not.toBe(undefined);
		expect(ret!.evj).toBeArrayOfSize(1);
		expect(ret!.evj[0].slug).toBe("bubble-vtest-v2");
	});
	it("Create correct video slug (part)", async () => {
		const [vresp, video] = await createVideo({
			path: "/video/bubble5.mkv",
			part: 1,
			version: 2,
			rendering: "oaoeueunhtoeuth",
		});
		expectStatus(vresp, video).toBe(201);

		const [resp, body] = await createMovie({
			...bubble,
			slug: "bubble-ptest",
			videos: [video[0].id],
		});
		expectStatus(resp, body).toBe(201);

		const ret = await db.query.videos.findFirst({
			where: eq(videos.id, video[0].id),
			with: { evj: { with: { entry: true } } },
		});
		expect(ret).not.toBe(undefined);
		expect(ret!.evj).toBeArrayOfSize(1);
		expect(ret!.evj[0].slug).toBe("bubble-ptest-p1-v2");
	});
	it("Create correct video slug (rendering)", async () => {
		const [vresp, video] = await createVideo([
			{
				path: "/video/bubble3.mkv",
				part: null,
				version: 1,
				rendering: "oeunhtoeuth",
			},
			{
				path: "/video/bubble4.mkv",
				part: null,
				version: 1,
				rendering: "aoeuaoeu",
			},
		]);
		expectStatus(vresp, video).toBe(201);

		const [resp, body] = await createMovie({
			...bubble,
			slug: "bubble-rtest",
			videos: [video[0].id, video[1].id],
		});
		expectStatus(resp, body).toBe(201);

		const ret = await db.query.shows.findFirst({
			where: eq(shows.id, body.id),
			with: { entries: { with: { evj: { with: { entry: true } } } } },
		});
		expect(ret).not.toBe(undefined);
		expect(ret!.entries).toBeArrayOfSize(1);
		expect(ret!.entries[0].slug).toBe("bubble-rtest");
		expect(ret!.entries[0].evj).toBeArrayOfSize(2);
		expect(ret!.entries[0].evj).toContainValues([
			expect.objectContaining({ slug: "bubble-rtest" }),
			expect.objectContaining({ slug: "bubble-rtest-aoeuaoeu" }),
		]);
	});
});

const cleanup = async () => {
	await db.delete(shows);
	await db.delete(videos);
};
// cleanup db beforehand to unsure tests are consistent
beforeAll(cleanup);
