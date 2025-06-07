import { beforeAll, describe, expect, it } from "bun:test";
import { eq } from "drizzle-orm";
import { createMovie, createSerie, createVideo } from "tests/helpers";
import { expectStatus } from "tests/utils";
import { db } from "~/db";
import { entries, shows, videos } from "~/db/schema";
import { bubble, madeInAbyss } from "~/models/examples";

beforeAll(async () => {
	await db.delete(shows);
	await db.delete(videos);
	let [ret, body] = await createSerie(madeInAbyss);
	expectStatus(ret, body).toBe(201);
	[ret, body] = await createMovie(bubble);
	expectStatus(ret, body).toBe(201);
});

describe("Video seeding", () => {
	it("Can create a video without entry", async () => {
		const [resp, body] = await createVideo({
			guess: { title: "unknown", from: "test", history: [] },
			part: null,
			path: "/video/unknown s1e13.mkv",
			rendering: "sha",
			version: 1,
		});

		expectStatus(resp, body).toBe(201);
		expect(body).toBeArrayOfSize(1);
		expect(body[0].id).toBeString();

		const vid = await db.query.videos.findFirst({
			where: eq(videos.id, body[0].id),
			with: {
				evj: { with: { entry: true } },
			},
		});

		expect(vid).not.toBeNil();
		expect(vid!.path).toBe("/video/unknown s1e13.mkv");
		expect(vid!.guess).toMatchObject({ title: "unknown", from: "test" });

		expect(body[0].entries).toBeArrayOfSize(0);
		expect(vid!.evj).toBeArrayOfSize(0);
	});

	it("With slug", async () => {
		const [resp, body] = await createVideo({
			guess: {
				title: "mia",
				episodes: [{ season: 1, episode: 13 }],
				from: "test",
				history: [],
			},
			part: null,
			path: "/video/mia s1e13.mkv",
			rendering: "sha2",
			version: 1,
			for: [{ slug: `${madeInAbyss.slug}-s1e13` }],
		});

		expectStatus(resp, body).toBe(201);
		expect(body).toBeArrayOfSize(1);
		expect(body[0].id).toBeString();

		const vid = await db.query.videos.findFirst({
			where: eq(videos.id, body[0].id),
			with: {
				evj: { with: { entry: true } },
			},
		});

		expect(vid).not.toBeNil();
		expect(vid!.path).toBe("/video/mia s1e13.mkv");
		expect(vid!.guess).toMatchObject({ title: "mia", from: "test" });

		expect(body[0].entries).toBeArrayOfSize(1);
		expect(vid!.evj).toBeArrayOfSize(1);

		expect(vid!.evj[0].slug).toBe(`${madeInAbyss.slug}-s1e13`);
		expect(vid!.evj[0].entry.slug).toBe(`${madeInAbyss.slug}-s1e13`);
	});

	it("With movie", async () => {
		const [resp, body] = await createVideo({
			guess: { title: "bubble", from: "test", history: [] },
			part: null,
			path: "/video/bubble.mkv",
			rendering: "sha3",
			version: 1,
			for: [{ movie: bubble.slug }],
		});

		expectStatus(resp, body).toBe(201);
		expect(body).toBeArrayOfSize(1);
		expect(body[0].id).toBeString();

		const vid = await db.query.videos.findFirst({
			where: eq(videos.id, body[0].id),
			with: {
				evj: { with: { entry: true } },
			},
		});

		expect(vid).not.toBeNil();
		expect(vid!.path).toBe("/video/bubble.mkv");
		expect(vid!.guess).toMatchObject({ title: "bubble", from: "test" });

		expect(body[0].entries).toBeArrayOfSize(1);
		expect(vid!.evj).toBeArrayOfSize(1);

		expect(vid!.evj[0].slug).toBe(bubble.slug);
		expect(vid!.evj[0].entry.slug).toBe(bubble.slug);
	});

	it("Conflicting path", async () => {
		const [resp, body] = await createVideo({
			guess: { title: "bubble", from: "test", history: [] },
			part: null,
			path: "/video/bubble.mkv",
			rendering: "sha4",
			version: 1,
			for: [{ movie: bubble.slug }],
		});

		expectStatus(resp, body).toBe(201);
		expect(body).toBeArrayOfSize(1);
		expect(body[0].id).toBeString();

		const vid = await db.query.videos.findFirst({
			where: eq(videos.id, body[0].id),
			with: {
				evj: { with: { entry: true } },
			},
		});

		expect(vid).not.toBeNil();
		expect(vid!.path).toBe("/video/bubble.mkv");
		expect(vid!.guess).toMatchObject({ title: "bubble", from: "test" });

		expect(body[0].entries).toBeArrayOfSize(1);
		expect(vid!.evj).toBeArrayOfSize(1);

		expect(vid!.evj[0].slug).toBe(bubble.slug);
		expect(vid!.evj[0].entry.slug).toBe(bubble.slug);
	});

	it("With season/episode", async () => {
		const [resp, body] = await createVideo({
			guess: {
				title: "mia",
				episodes: [{ season: 2, episode: 1 }],
				from: "test",
				history: [],
			},
			part: null,
			path: "/video/mia s2e1.mkv",
			rendering: "renderingsha",
			version: 1,
			for: [
				{
					serie: madeInAbyss.slug,
					season: madeInAbyss.entries[3].seasonNumber!,
					episode: madeInAbyss.entries[3].episodeNumber!,
				},
			],
		});

		expectStatus(resp, body).toBe(201);
		expect(body).toBeArrayOfSize(1);
		expect(body[0].id).toBeString();

		const vid = await db.query.videos.findFirst({
			where: eq(videos.id, body[0].id),
			with: {
				evj: { with: { entry: true } },
			},
		});

		expect(vid).not.toBeNil();
		expect(vid!.path).toBe("/video/mia s2e1.mkv");
		expect(vid!.guess).toMatchObject({ title: "mia", from: "test" });

		expect(body[0].entries).toBeArrayOfSize(1);
		expect(vid!.evj).toBeArrayOfSize(1);

		expect(vid!.evj[0].slug).toBe(`${madeInAbyss.slug}-s2e1`);
		expect(vid!.evj[0].entry.slug).toBe(`${madeInAbyss.slug}-s2e1`);
	});

	it("With special", async () => {
		const [resp, body] = await createVideo({
			guess: {
				title: "mia",
				episodes: [{ season: 0, episode: 3 }],
				from: "test",
				history: [],
			},
			part: null,
			path: "/video/mia sp3.mkv",
			rendering: "notehu",
			version: 1,
			for: [
				{
					serie: madeInAbyss.slug,
					special: madeInAbyss.entries[1].number!,
				},
			],
		});

		expectStatus(resp, body).toBe(201);
		expect(body).toBeArrayOfSize(1);
		expect(body[0].id).toBeString();

		const vid = await db.query.videos.findFirst({
			where: eq(videos.id, body[0].id),
			with: {
				evj: { with: { entry: true } },
			},
		});

		expect(vid).not.toBeNil();
		expect(vid!.path).toBe("/video/mia sp3.mkv");
		expect(vid!.guess).toMatchObject({ title: "mia", from: "test" });

		expect(body[0].entries).toBeArrayOfSize(1);
		expect(vid!.evj).toBeArrayOfSize(1);

		expect(vid!.evj[0].slug).toBe(`${madeInAbyss.slug}-sp3`);
		expect(vid!.evj[0].entry.slug).toBe(`${madeInAbyss.slug}-sp3`);
	});

	it("With order", async () => {
		const [resp, body] = await createVideo({
			guess: {
				title: "mia",
				episodes: [{ season: 0, episode: 3 }],
				from: "test",
				history: [],
			},
			part: null,
			path: "/video/mia 13.5.mkv",
			rendering: "notehu2",
			version: 1,
			for: [
				{
					serie: madeInAbyss.slug,
					order: 13.5,
				},
			],
		});

		expectStatus(resp, body).toBe(201);
		expect(body).toBeArrayOfSize(1);
		expect(body[0].id).toBeString();

		const vid = await db.query.videos.findFirst({
			where: eq(videos.id, body[0].id),
			with: {
				evj: { with: { entry: true } },
			},
		});

		expect(vid).not.toBeNil();
		expect(vid!.path).toBe("/video/mia 13.5.mkv");
		expect(vid!.guess).toMatchObject({ title: "mia", from: "test" });

		expect(body[0].entries).toBeArrayOfSize(1);
		expect(vid!.evj).toBeArrayOfSize(1);

		expect(vid!.evj[0].slug).toBe("made-in-abyss-dawn-of-the-deep-soul");
		expect(vid!.evj[0].entry.slug).toBe("made-in-abyss-dawn-of-the-deep-soul");
	});

	it("With external id", async () => {
		const [resp, body] = await createVideo({
			guess: {
				title: "mia",
				episodes: [{ season: 1, episode: 13 }],
				from: "test",
				history: [],
				externalId: {
					themoviedatabase: "72636",
				},
			},
			part: null,
			path: "/video/mia s1e13 [tmdb=72636].mkv",
			rendering: "notehu3",
			version: 1,
			for: [
				{
					externalId: {
						themoviedatabase: { serieId: "72636", season: 1, episode: 13 },
					},
				},
			],
		});

		expectStatus(resp, body).toBe(201);
		expect(body).toBeArrayOfSize(1);
		expect(body[0].id).toBeString();

		const vid = await db.query.videos.findFirst({
			where: eq(videos.id, body[0].id),
			with: {
				evj: { with: { entry: true } },
			},
		});

		expect(vid).not.toBeNil();
		expect(vid!.path).toBe("/video/mia s1e13 [tmdb=72636].mkv");
		expect(vid!.guess).toMatchObject({ title: "mia", from: "test" });

		expect(body[0].entries).toBeArrayOfSize(1);
		expect(vid!.evj).toBeArrayOfSize(1);

		expect(vid!.evj[0].slug).toBe("made-in-abyss-s1e13-notehu3");
		expect(vid!.evj[0].entry.slug).toBe("made-in-abyss-s1e13");
	});

	it("With movie external id", async () => {
		const [resp, body] = await createVideo({
			guess: {
				title: "bubble",
				from: "test",
				history: [],
				externalId: {
					themoviedatabase: "912598",
				},
			},
			part: null,
			path: "/video/bubble [tmdb=912598].mkv",
			rendering: "onetuh",
			version: 1,
			for: [
				{
					externalId: {
						themoviedatabase: { dataId: "912598" },
					},
				},
			],
		});

		expectStatus(resp, body).toBe(201);
		expect(body).toBeArrayOfSize(1);
		expect(body[0].id).toBeString();

		const vid = await db.query.videos.findFirst({
			where: eq(videos.id, body[0].id),
			with: {
				evj: { with: { entry: true } },
			},
		});

		expect(vid).not.toBeNil();
		expect(vid!.path).toBe("/video/bubble [tmdb=912598].mkv");
		expect(vid!.guess).toMatchObject({ title: "bubble", from: "test" });

		expect(body[0].entries).toBeArrayOfSize(1);
		expect(vid!.evj).toBeArrayOfSize(1);

		expect(vid!.evj[0].slug).toBe("bubble-onetuh");
		expect(vid!.evj[0].entry.slug).toBe("bubble");
	});

	it("Different path, same sha", async () => {
		const [resp, body] = await createVideo({
			guess: { title: "bubble", from: "test", history: [] },
			part: null,
			path: "/video/bubble invalid-sha.mkv",
			rendering: "sha",
			version: 1,
			for: [{ movie: bubble.slug }],
		});

		// conflict with existing video, message will contain an explanation on how to fix this
		expectStatus(resp, body).toBe(409);
		expect(body.message).toBeString();
	});

	it("Two for the same entry", async () => {
		const [resp, body] = await createVideo({
			guess: {
				title: "bubble",
				from: "test",
				history: [],
				externalId: {
					themoviedatabase: "912598",
				},
			},
			part: null,
			path: "/video/bubble ue [tmdb=912598].mkv",
			rendering: "aoeubnht",
			version: 1,
			for: [
				{ movie: "bubble" },
				{
					externalId: {
						themoviedatabase: { dataId: "912598" },
					},
				},
			],
		});

		expectStatus(resp, body).toBe(201);
		expect(body).toBeArrayOfSize(1);
		expect(body[0].id).toBeString();

		const vid = await db.query.videos.findFirst({
			where: eq(videos.id, body[0].id),
			with: {
				evj: { with: { entry: true } },
			},
		});

		expect(vid).not.toBeNil();
		expect(vid!.path).toBe("/video/bubble ue [tmdb=912598].mkv");
		expect(vid!.guess).toMatchObject({ title: "bubble", from: "test" });

		expect(body[0].entries).toBeArrayOfSize(1);
		expect(vid!.evj).toBeArrayOfSize(1);

		expect(vid!.evj[0].slug).toBe("bubble-aoeubnht");
		expect(vid!.evj[0].entry.slug).toBe("bubble");
	});

	it("Two for the same entry WITHOUT rendering", async () => {
		await db.delete(videos);
		const [resp, body] = await createVideo({
			guess: {
				title: "bubble",
				from: "test",
				history: [],
				externalId: {
					themoviedatabase: "912598",
				},
			},
			part: null,
			path: "/video/bubble [tmdb=912598].mkv",
			rendering: "cwhtn",
			version: 1,
			for: [
				{ movie: "bubble" },
				{
					externalId: {
						themoviedatabase: { dataId: "912598" },
					},
				},
			],
		});

		expectStatus(resp, body).toBe(201);
		expect(body).toBeArrayOfSize(1);
		expect(body[0].id).toBeString();

		const vid = await db.query.videos.findFirst({
			where: eq(videos.id, body[0].id),
			with: {
				evj: { with: { entry: true } },
			},
		});

		expect(vid).not.toBeNil();
		expect(vid!.path).toBe("/video/bubble [tmdb=912598].mkv");
		expect(vid!.guess).toMatchObject({ title: "bubble", from: "test" });

		expect(body[0].entries).toBeArrayOfSize(1);
		expect(vid!.evj).toBeArrayOfSize(1);

		expect(vid!.evj[0].slug).toBe("bubble");
		expect(vid!.evj[0].entry.slug).toBe("bubble");
	});

	it("Multi part", async () => {
		await db.delete(videos);
		const [resp, body] = await createVideo([
			{
				guess: {
					title: "bubble",
					from: "test",
					history: [],
					externalId: {
						themoviedatabase: "912598",
					},
				},
				part: 1,
				path: "/video/bubble p1 [tmdb=912598].mkv",
				rendering: "cwhtn",
				version: 1,
				for: [
					{ movie: "bubble" },
					{
						externalId: {
							themoviedatabase: { dataId: "912598" },
						},
					},
				],
			},
			{
				guess: {
					title: "bubble",
					from: "test",
					history: [],
					externalId: {
						themoviedatabase: "912598",
					},
				},
				part: 2,
				path: "/video/bubble p2 [tmdb=912598].mkv",
				rendering: "cwhtn",
				version: 1,
				for: [
					{ movie: "bubble" },
					{
						externalId: {
							themoviedatabase: { dataId: "912598" },
						},
					},
				],
			},
		]);

		expectStatus(resp, body).toBe(201);
		expect(body).toBeArrayOfSize(2);
		expect(body[0].id).toBeString();
		expect(body[1].id).toBeString();
		expect(body[0].entries).toBeArrayOfSize(1);
		expect(body[1].entries).toBeArrayOfSize(1);

		const entr = (await db.query.entries.findFirst({
			where: eq(entries.slug, bubble.slug),
			with: {
				evj: { with: { video: true } },
			},
		}))!;

		expect(entr.evj).toBeArrayOfSize(2);
		expect(entr.evj[0].video.path).toBe("/video/bubble p1 [tmdb=912598].mkv");

		expect(entr.evj[0].slug).toBe("bubble-p1");
		expect(entr.evj[1].slug).toBe("bubble-p2");
	});

	it("Multi entry", async () => {
		await db.delete(videos);
		const [resp, body] = await createVideo({
			guess: {
				title: "mia",
				episodes: [
					{ season: 1, episode: 13 },
					{ season: 2, episode: 1 },
				],
				from: "test",
				history: [],
			},
			part: null,
			path: "/video/mia s1e13 & s2e1 [tmdb=72636].mkv",
			rendering: "notehu5",
			version: 1,
			for: [
				{ serie: madeInAbyss.slug, season: 1, episode: 13 },
				{
					externalId: {
						themoviedatabase: { serieId: "72636", season: 1, episode: 13 },
					},
				},
				{ serie: madeInAbyss.slug, season: 2, episode: 1 },
			],
		});

		expectStatus(resp, body).toBe(201);
		expect(body).toBeArrayOfSize(1);
		expect(body[0].id).toBeString();

		const vid = await db.query.videos.findFirst({
			where: eq(videos.id, body[0].id),
			with: {
				evj: { with: { entry: true } },
			},
		});

		expect(vid).not.toBeNil();
		expect(vid!.path).toBe("/video/mia s1e13 & s2e1 [tmdb=72636].mkv");
		expect(vid!.guess).toMatchObject({ title: "mia", from: "test" });

		expect(body[0].entries).toBeArrayOfSize(2);
		expect(vid!.evj).toBeArrayOfSize(2);

		expect(vid!.evj[0].slug).toBe("made-in-abyss-s1e13");
		expect(vid!.evj[0].entry.slug).toBe("made-in-abyss-s1e13");
		expect(vid!.evj[1].slug).toBe("made-in-abyss-s2e1");
		expect(vid!.evj[1].entry.slug).toBe("made-in-abyss-s2e1");
	});
});
