import { beforeAll, describe, expect, it } from "bun:test";
import { eq } from "drizzle-orm";
import { createMovie, createSerie, createVideo } from "tests/helpers";
import { expectStatus } from "tests/utils";
import { db } from "~/db";
import { entries, shows, videos } from "~/db/schema";
import { bubble, madeInAbyss } from "~/models/examples";

beforeAll(async () => {
	await db.delete(shows);
	await db.delete(entries);
	await db.delete(videos);
	let [ret, body] = await createSerie(madeInAbyss);
	expectStatus(ret, body).toBe(201);
	[ret, body] = await createMovie(bubble);
	expectStatus(ret, body).toBe(201);
});

describe("Video seeding", () => {
	it("Can create a video without entry", async () => {
		const [resp, body] = await createVideo({
			guess: { title: "unknown", from: "test" },
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
			guess: { title: "mia", season: [1], episode: [13], from: "test" },
			part: null,
			path: "/video/mia s1e13.mkv",
			rendering: "sha",
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

	it("With season/episode", async () => {
		const [resp, body] = await createVideo({
			guess: { title: "mia", season: [1], episode: [13], from: "test" },
			part: null,
			path: "/video/mia s1e13.mkv",
			rendering: "renderingsha",
			version: 1,
			for: [
				{
					serie: madeInAbyss.slug,
					season: madeInAbyss.entries[0].seasonNumber!,
					episode: madeInAbyss.entries[0].episodeNumber!,
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
		expect(vid!.path).toBe("/video/mia s1e13.mkv");
		expect(vid!.guess).toMatchObject({ title: "mia", from: "test" });

		expect(body[0].entries).toBeArrayOfSize(1);
		expect(vid!.evj).toBeArrayOfSize(1);

		expect(vid!.evj[0].slug).toBe(`${madeInAbyss.slug}-s1e13-renderingsha`);
		expect(vid!.evj[0].entry.slug).toBe(`${madeInAbyss.slug}-s1e13`);
	});
});
