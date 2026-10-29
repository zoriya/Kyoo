import { beforeAll, expect, it } from "bun:test";
import { eq } from "drizzle-orm";
import { createSerie, createVideo, linkVideos } from "tests/helpers";
import { expectStatus } from "tests/utils";
import { db } from "~/db";
import { entries, shows, videos } from "~/db/schema";
import { madeInAbyss } from "~/models/examples";

const getEntry = async (slug: string) =>
	(await db.query.entries.findFirst({ where: eq(entries.slug, slug) }))!;

beforeAll(async () => {
	await db.delete(shows);
	await db.delete(videos);
	const [ret, body] = await createSerie(madeInAbyss);
	expectStatus(ret, body).toBe(201);
});

it("Unlink one entry of a multi-entry video", async () => {
	let [resp, body] = await createVideo({
		guess: { title: "mia", episodes: [], from: "test", history: [] },
		part: null,
		path: "/video/mia 01.mkv",
		rendering: "sha",
		version: 1,
		for: [
			{ slug: `${madeInAbyss.slug}-s1e13` },
			{ slug: `${madeInAbyss.slug}-s2e1` },
		],
	});
	expectStatus(resp, body).toBe(201);
	const vid = body[0].id;

	await db
		.update(entries)
		.set({ availableSince: new Date("2020-01-01") })
		.where(eq(entries.slug, `${madeInAbyss.slug}-s1e13`));

	[resp, body] = await linkVideos(
		[{ id: vid, for: [{ slug: `${madeInAbyss.slug}-s1e13` }] }],
		"PUT",
	);
	expectStatus(resp, body).toBe(201);

	expect((await getEntry(`${madeInAbyss.slug}-s1e13`)).availableSince).toEqual(
		new Date("2020-01-01"),
	);
	expect((await getEntry(`${madeInAbyss.slug}-s2e1`)).availableSince).toBe(
		null,
	);
	const show = await db.query.shows.findFirst({
		where: eq(shows.slug, madeInAbyss.slug),
	});
	expect(show!.availableCount).toBe(1);
});
