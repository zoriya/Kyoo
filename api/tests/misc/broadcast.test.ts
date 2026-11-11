import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { Elysia } from "elysia";
import { SignJWT } from "jose";
import {
	addToHistory,
	createMovie,
	createSerie,
	createVideo,
	deleteVideo,
	linkVideos,
	setMovieStatus,
	setSerieStatus,
} from "tests/helpers";
import { getJwtHeaders } from "tests/helpers/jwt";
import { buildUrl, expectStatus } from "tests/utils";
import { handlers } from "~/base";
import { db } from "~/db";
import { shows, videos } from "~/db/schema";
import {
	bubble,
	dune,
	duneCollection,
	madeInAbyss,
	madeInAbyssVideo,
} from "~/models/examples";
import { listenBroadcasts } from "~/websockets";

// two api instances sharing the database, like two pods
const podA = new Elysia().use(handlers).listen(0);
const podB = new Elysia().use(handlers).listen(0);
const disposers: (() => void)[] = [];
let a: Awaited<ReturnType<typeof connect>>;
let b: Awaited<ReturnType<typeof connect>>;
// someone else, without `core.read` so they should never receive anything
let other: Awaited<ReturnType<typeof connect>>;

beforeAll(async () => {
	await db.delete(shows);
	await db.delete(videos);
	disposers.push(await listenBroadcasts(podA.server!));
	disposers.push(await listenBroadcasts(podB.server!));
	a = await connect(podA);
	b = await connect(podB);
	other = await connect(podA, {
		Authorization: `Bearer ${await new SignJWT({
			sub: "a3fbcd7e-6f7e-4e75-9a1a-7b0b2f1bb6e1",
			sid: "8c1a0f8a-e8a3-4ba4-a1f6-0e1bd9bc0a26",
			username: "someone-else",
			permissions: [],
		})
			.setProtectedHeader({ alg: "HS256" })
			.setIssuedAt()
			.setIssuer(process.env.JWT_ISSUER!)
			.setExpirationTime("2h")
			.sign(new TextEncoder().encode(process.env.JWT_SECRET))}`,
	});
});

afterAll(async () => {
	a.ws.close();
	b.ws.close();
	other.ws.close();
	for (const dispose of disposers) dispose();
	await podA.stop(true);
	await podB.stop(true);
});

const connect = async (pod: typeof podA, headers?: Record<string, string>) => {
	const ws = new WebSocket(`ws://localhost:${pod.server!.port}/api/ws`, {
		headers: headers ?? (await getJwtHeaders()),
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
	expect(other.messages.splice(0)).toEqual([]);
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
			show: { id: movie.id, slug: dune.slug },
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
			show: { id: serie.id, slug: madeInAbyss.slug },
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

describe("User events", () => {
	const mia = { id: "", slug: madeInAbyss.slug, kind: "serie" };

	beforeAll(async () => {
		await db.insert(videos).values(madeInAbyssVideo);
		mia.id = (await db.query.shows.findFirst({
			where: (x, { eq }) => eq(x.slug, madeInAbyss.slug),
		}))!.id;
	});

	it("Send watchstatus of series", async () => {
		let [resp, body] = await setSerieStatus(madeInAbyss.slug, {
			status: "planned",
			score: null,
			startedAt: null,
			completedAt: null,
		});
		expectStatus(resp, body).toBe(200);
		expect(await received(1)).toEqual([
			{
				action: "created",
				kind: "watchstatus",
				show: mia,
				watchStatus: {
					status: "planned",
					score: null,
					startedAt: expect.any(String),
					completedAt: null,
					seenCount: 0,
					percent: 0,
				},
			},
		]);

		[resp, body] = await setSerieStatus(madeInAbyss.slug, {
			status: "dropped",
			score: null,
			startedAt: null,
			completedAt: null,
		});
		expectStatus(resp, body).toBe(200);
		expect(await received(1)).toEqual([
			{
				action: "updated",
				kind: "watchstatus",
				show: mia,
				watchStatus: {
					status: "dropped",
					score: null,
					startedAt: expect.any(String),
					completedAt: null,
					seenCount: 0,
					percent: 0,
				},
			},
		]);
	});

	it("Send progress & the watchstatus it changes", async () => {
		const entry = {
			id: (await db.query.entries.findFirst({
				where: (x, { eq }) => eq(x.slug, `${madeInAbyss.slug}-s1e13`),
			}))!.id,
			slug: `${madeInAbyss.slug}-s1e13`,
		};
		let [resp, body] = await addToHistory("me", [
			{
				entry: entry.slug,
				videoId: madeInAbyssVideo.id,
				percent: 58,
				time: 28 * 60 + 12,
				playedDate: null,
			},
		]);
		expectStatus(resp, body).toBe(201);
		expect(await received(2)).toEqual([
			{
				action: "created",
				kind: "progress",
				entry,
				show: mia,
				progress: {
					percent: 58,
					time: 28 * 60 + 12,
					playedDate: expect.any(String),
					videoId: madeInAbyssVideo.id,
				},
			},
			{
				action: "updated",
				kind: "watchstatus",
				show: mia,
				watchStatus: {
					status: "watching",
					score: null,
					startedAt: expect.any(String),
					completedAt: null,
					seenCount: 1,
					percent: 1,
				},
			},
		]);

		// watching more of the same video is not worth an event (every 10s)
		[resp, body] = await addToHistory("me", [
			{
				entry: entry.slug,
				videoId: madeInAbyssVideo.id,
				percent: 70,
				time: 30 * 60,
				playedDate: null,
			},
		]);
		expectStatus(resp, body).toBe(201);
		expect(await received(0)).toEqual([]);

		// finishing it is
		[resp, body] = await addToHistory("me", [
			{
				entry: entry.slug,
				videoId: madeInAbyssVideo.id,
				percent: 100,
				time: 0,
				playedDate: null,
			},
		]);
		expectStatus(resp, body).toBe(201);
		expect(await received(2)).toEqual([
			{
				action: "updated",
				kind: "progress",
				entry,
				show: mia,
				progress: {
					percent: 100,
					time: 0,
					playedDate: expect.any(String),
					videoId: madeInAbyssVideo.id,
				},
			},
			{
				action: "updated",
				kind: "watchstatus",
				show: mia,
				watchStatus: {
					status: "watching",
					score: null,
					startedAt: expect.any(String),
					completedAt: null,
					seenCount: 1,
					percent: 1,
				},
			},
		]);
	});

	it("Send deleted watchstatus", async () => {
		const resp = await handlers.handle(
			new Request(buildUrl(`series/${madeInAbyss.slug}/watchstatus`), {
				method: "DELETE",
				headers: await getJwtHeaders(),
			}),
		);
		const body = await resp.json();
		expectStatus(resp, body).toBe(200);
		expect(await received(1)).toEqual([
			{ action: "deleted", kind: "watchstatus", show: mia },
		]);
	});

	it("Send watchstatus of movies", async () => {
		let [resp, body] = await createMovie(bubble);
		expectStatus(resp, body).toBe(201);
		const show = { id: body.id, slug: bubble.slug, kind: "movie" };
		expect(await received(1)).toEqual([
			{ action: "created", kind: "movie", id: show.id, slug: show.slug },
		]);

		[resp, body] = await setMovieStatus(bubble.slug, {
			status: "completed",
			score: 80,
			completedAt: null,
		});
		expectStatus(resp, body).toBe(200);
		expect(await received(1)).toEqual([
			{
				action: "created",
				kind: "watchstatus",
				show,
				watchStatus: {
					status: "completed",
					score: 80,
					startedAt: expect.any(String),
					completedAt: null,
					seenCount: 100,
					percent: 100,
				},
			},
		]);

		resp = await handlers.handle(
			new Request(buildUrl(`movies/${bubble.slug}/watchstatus`), {
				method: "DELETE",
				headers: await getJwtHeaders(),
			}),
		);
		body = await resp.json();
		expectStatus(resp, body).toBe(200);
		expect(await received(1)).toEqual([
			{ action: "deleted", kind: "watchstatus", show },
		]);
	});
});
