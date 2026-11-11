import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { Elysia } from "elysia";
import {
	createMovie,
	createSerie,
	createVideo,
	deleteVideo,
	linkVideos,
} from "tests/helpers";
import { getJwtHeaders } from "tests/helpers/jwt";
import { buildUrl, expectStatus } from "tests/utils";
import { handlers } from "~/base";
import { db } from "~/db";
import { shows, videos } from "~/db/schema";
import { dune, duneCollection, madeInAbyss } from "~/models/examples";
import { listenBroadcasts } from "~/websockets";

// two api instances sharing the database, like two pods
const podA = new Elysia().use(handlers).listen(0);
const podB = new Elysia().use(handlers).listen(0);
const disposers: (() => void)[] = [];
let a: Awaited<ReturnType<typeof connect>>;
let b: Awaited<ReturnType<typeof connect>>;

beforeAll(async () => {
	await db.delete(shows);
	await db.delete(videos);
	disposers.push(await listenBroadcasts(podA.server!));
	disposers.push(await listenBroadcasts(podB.server!));
	a = await connect(podA);
	b = await connect(podB);
});

afterAll(async () => {
	a.ws.close();
	b.ws.close();
	for (const dispose of disposers) dispose();
	await podA.stop(true);
	await podB.stop(true);
});

const connect = async (pod: typeof podA) => {
	const ws = new WebSocket(`ws://localhost:${pod.server!.port}/api/ws`, {
		headers: await getJwtHeaders(),
	} as any);
	const messages: any[] = [];
	ws.addEventListener("message", (e) => messages.push(JSON.parse(e.data)));
	await new Promise((resolve, reject) => {
		ws.addEventListener("open", resolve);
		ws.addEventListener("error", reject);
	});
	return { ws, messages };
};

// wait for the events of a request & check both pods received the same ones
const received = async (count: number) => {
	for (
		let i = 0;
		i < 50 && (a.messages.length < count || b.messages.length < count);
		i++
	)
		await Bun.sleep(20);
	// leave time for unexpected events to arrive
	await Bun.sleep(50);
	const ret = a.messages.splice(0);
	expect(b.messages.splice(0)).toEqual(ret);
	return ret;
};

describe("Broadcast", () => {
	it("Send created & updated series", async () => {
		let [resp, body] = await createSerie(madeInAbyss);
		expectStatus(resp, body).toBe(201);
		expect(await received(1)).toEqual([
			{
				action: "created",
				kind: "serie",
				id: body.id,
				slug: madeInAbyss.slug,
			},
		]);

		[resp, body] = await createSerie(madeInAbyss);
		expectStatus(resp, body).toBe(200);
		expect(await received(1)).toEqual([
			{
				action: "updated",
				kind: "serie",
				id: body.id,
				slug: madeInAbyss.slug,
			},
		]);
	});

	it("Send movies & their collection", async () => {
		const [resp, body] = await createMovie({
			...dune,
			collection: duneCollection,
		});
		expectStatus(resp, body).toBe(201);
		expect(await received(2)).toEqual([
			{ action: "created", kind: "movie", id: body.id, slug: dune.slug },
			{
				action: "created",
				kind: "collection",
				id: body.collection.id,
				slug: duneCollection.slug,
			},
		]);
	});

	it("Send videos & their links", async () => {
		const video = {
			guess: { title: "dune", from: "test", history: [] },
			part: null,
			path: "/video/dune.mkv",
			rendering: "sha-dune",
			version: 1,
		};
		let [resp, body] = await createVideo({
			...video,
			for: [{ movie: dune.slug }],
		});
		expectStatus(resp, body).toBe(201);
		const [vid] = body;
		const movie = (await db.query.shows.findFirst({
			where: (x, { eq }) => eq(x.slug, dune.slug),
		}))!;
		const movieEntry = (await db.query.entries.findFirst({
			where: (x, { eq }) => eq(x.showPk, movie.pk),
		}))!;
		const duneLink = {
			slug: vid.entries[0].slug,
			entry: { id: movieEntry.id, slug: movieEntry.slug },
			show: { id: movie.id, slug: dune.slug, kind: "movie" },
			video: { id: vid.id, path: video.path },
		};
		expect(await received(2)).toEqual([
			{ action: "created", kind: "video", id: vid.id, path: video.path },
			{ action: "created", kind: "video-link", ...duneLink },
		]);

		// replacing links with the same ones changes nothing
		[resp, body] = await linkVideos(
			[{ id: vid.id, for: [{ movie: dune.slug }] }],
			"PUT",
		);
		expectStatus(resp, body).toBe(201);
		expect(await received(0)).toEqual([]);

		[resp, body] = await linkVideos([
			{ id: vid.id, for: [{ slug: `${madeInAbyss.slug}-s1e13` }] },
		]);
		expectStatus(resp, body).toBe(201);
		const serie = (await db.query.shows.findFirst({
			where: (x, { eq }) => eq(x.slug, madeInAbyss.slug),
		}))!;
		const miaLink = {
			slug: body[0].entries[0].slug,
			entry: {
				id: (await db.query.entries.findFirst({
					where: (x, { eq }) => eq(x.slug, `${madeInAbyss.slug}-s1e13`),
				}))!.id,
				slug: `${madeInAbyss.slug}-s1e13`,
			},
			show: { id: serie.id, slug: madeInAbyss.slug, kind: "serie" },
			video: { id: vid.id, path: video.path },
		};
		expect(await received(1)).toEqual([
			{ action: "created", kind: "video-link", ...miaLink },
		]);

		resp = await handlers.handle(
			new Request(buildUrl("videos/link"), {
				method: "DELETE",
				body: JSON.stringify([miaLink.slug]),
				headers: {
					"Content-Type": "application/json",
					...(await getJwtHeaders()),
				},
			}),
		);
		body = await resp.json();
		expectStatus(resp, body).toBe(200);
		expect(await received(1)).toEqual([
			{ action: "deleted", kind: "video-link", ...miaLink },
		]);

		[resp, body] = await deleteVideo([video.path]);
		expectStatus(resp, body).toBe(200);
		expect(await received(2)).toEqual([
			{ action: "deleted", kind: "video", id: vid.id, path: video.path },
			{ action: "deleted", kind: "video-link", ...duneLink },
		]);
	});

	it("Send deleted shows", async () => {
		const resp = await handlers.handle(
			new Request(buildUrl(`movies/${dune.slug}`), {
				method: "DELETE",
				headers: await getJwtHeaders(),
			}),
		);
		const body = await resp.json();
		expectStatus(resp, body).toBe(200);
		expect(await received(1)).toEqual([
			{ action: "deleted", kind: "movie", id: body.id, slug: dune.slug },
		]);
	});
});
