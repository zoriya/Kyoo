import { beforeEach, describe, expect, test } from "bun:test";
import { createLiveQueryCollection, eq, inArray } from "@tanstack/react-db";
import { entries } from "./entries";
import {
	mockFetch,
	pagedRoute,
	rawEntry,
	rawSerie,
	testClient,
	tick,
} from "./fixtures.test-helpers";
import { showQuery, shows, watchStatusOf } from "./shows";

let calls: string[];
let all = ["a", "b", "c", "d", "e"];
let serverName = "Serie abyss-id";

beforeEach(() => {
	all = ["a", "b", "c", "d", "e"];
	serverName = "Serie abyss-id";
	calls = mockFetch({
		"/api/shows": pagedRoute(
			() => all,
			(id) =>
				rawSerie(id, {
					genres: id === "b" ? ["drama"] : ["action"],
					watchStatus:
						id === "a"
							? {
									status: "watching",
									score: null,
									startedAt: null,
									completedAt: null,
									seenCount: 1,
									lastPlayedAt: "2024-01-01T00:00:00Z",
								}
							: null,
				}),
		),
		"/api/series/abyss": () =>
			rawSerie("abyss-id", {
				slug: "abyss",
				name: serverName,
				firstEntry: rawEntry(1),
				nextEntry: rawEntry(3, {
					videos: [
						{
							id: "v3",
							slug: "entry-3-v",
							path: "/e3.mkv",
							rendering: "x",
							part: null,
							version: 1,
						},
					],
				}),
				collection: null,
			}),
		"/api/series/abyss/watchstatus": () => ({ status: "completed" }),
	});
});

describe("shows: lists", () => {
	test("where/orderBy/limit become filter/sort/limit, next pages follow the api cursor", async () => {
		const client = testClient();
		const showsC = client.collection(shows);
		const live = createLiveQueryCollection({
			startSync: true,
			query: (q) =>
				q
					.from({ s: showsC })
					.where(({ s }) => inArray("action", s.genres))
					.orderBy(({ s }) => s.name, "asc")
					.limit(3)
					.offset(0),
		});
		await live.toArrayWhenReady();

		expect(calls).toEqual([
			"GET /api/shows?with=firstEntry,nextEntry&filter=genres%20has%20action&sort=name&limit=3",
		]);
		// "b" is served by the api (mock ignores filters) but doesn't match locally
		expect(live.toArray.map((x) => x.id)).toEqual(["a", "c"]);
		expect(showsC.get("a")?.watchStatus?.status).toBe("watching");

		await live.utils.setWindow({ offset: 0, limit: 5 });
		await tick();
		expect(calls[1]).toContain("/api/shows?");
		expect(calls[1]).toContain("after=c");
		expect(live.toArray.map((x) => x.id)).toEqual(["a", "c", "d", "e"]);
	});

	test("an identical query is served from the cache", async () => {
		const client = testClient();
		const showsC = client.collection(shows);
		const open = () =>
			createLiveQueryCollection({
				startSync: true,
				query: (q) =>
					q
						.from({ s: showsC })
						.orderBy(({ s }) => s.name)
						.limit(3)
						.offset(0),
			});
		await open().toArrayWhenReady();
		await open().toArrayWhenReady();
		expect(calls.length).toBe(1);
	});

	test("refetch reloads the first page of each request, rows survive a failure", async () => {
		const client = testClient();
		const showsC = client.collection(shows);
		const live = createLiveQueryCollection({
			startSync: true,
			query: (q) =>
				q
					.from({ s: showsC })
					.orderBy(({ s }) => s.name)
					.limit(3)
					.offset(0),
		});
		await live.toArrayWhenReady();
		await showsC.utils.refetch();
		expect(calls).toEqual([
			"GET /api/shows?with=firstEntry,nextEntry&sort=name&limit=3",
			"GET /api/shows?with=firstEntry,nextEntry&sort=name&limit=3",
		]);

		calls = mockFetch({ "/api/shows": () => new Error("offline") });
		await expect(showsC.utils.refetch()).rejects.toThrow("offline");
		expect(live.toArray.length).toBe(3);
	});

	test("a failed load flags the live query and is retried by the next window", async () => {
		calls = mockFetch({ "/api/shows": () => new Error("offline") });
		const client = testClient();
		const showsC = client.collection(shows);
		const live = createLiveQueryCollection({
			startSync: true,
			query: (q) =>
				q
					.from({ s: showsC })
					.orderBy(({ s }) => s.name)
					.limit(3)
					.offset(0),
		});
		await live.preload().catch(() => {});
		expect(live.status).toBe("error");
		expect(live.utils.lastSubsetError).toBeInstanceOf(Error);
		expect(calls.length).toBe(1);

		// back online: a fresh live query asks the same window again
		calls = mockFetch({
			"/api/shows": pagedRoute(
				() => all,
				(id) => rawSerie(id),
			),
		});
		const retry = createLiveQueryCollection({
			startSync: true,
			query: (q) =>
				q
					.from({ s: showsC })
					.orderBy(({ s }) => s.name)
					.limit(3)
					.offset(0),
		});
		expect((await retry.toArrayWhenReady()).length).toBe(3);
		expect(calls.length).toBe(1);
	});
});

describe("shows: details", () => {
	test("kind + slug select the detail route, entries are normalized and joined back", async () => {
		const client = testClient();
		const live = createLiveQueryCollection({
			startSync: true,
			query: (q) => showQuery(q, "serie", "abyss", client),
		});
		await live.toArrayWhenReady();

		expect(calls).toEqual([
			"GET /api/series/abyss?with=collection,studios,firstEntry,nextEntry",
		]);
		const show = live.toArray[0]!;
		expect(show.kind === "serie" && show.firstEntry?.slug).toBe("entry-1");
		expect(show.kind === "serie" && show.nextEntry?.slug).toBe("entry-3");
		expect(show.playHref).toBe("/watch/entry-3-v");
		expect(client.collection(entries).get("entry-3")?.showSlug).toBe("abyss");

		// an entry update is visible through the show
		client
			.collection(entries)
			.utils.writer()
			.upsert([{ id: "entry-3", name: "Renamed" }]);
		await tick();
		expect(
			live.toArray[0]?.kind === "serie" && live.toArray[0].nextEntry?.name,
		).toBe("Renamed");
	});

	test("watch status mutation posts then re-fetches", async () => {
		const client = testClient();
		const showsC = client.collection(shows);
		const live = createLiveQueryCollection({
			startSync: true,
			query: (q) => showQuery(q, "serie", "abyss", client),
		});
		await live.toArrayWhenReady();

		const tx = showsC.update("abyss-id", (d) => {
			if (d.kind === "collection") return;
			d.watchStatus = watchStatusOf(d, "completed");
		});
		expect(
			live.toArray[0]?.kind === "serie" && live.toArray[0].watchStatus?.status,
		).toBe("completed");
		await tx.isPersisted.promise;
		await tick();
		expect(calls.slice(1)).toEqual([
			"POST /api/series/abyss/watchstatus",
			"GET /api/series/abyss?with=collection,studios,firstEntry,nextEntry",
		]);
	});

	test("a query the api can't serve loads nothing", async () => {
		const client = testClient();
		const showsC = client.collection(shows);
		const live = createLiveQueryCollection({
			startSync: true,
			query: (q) =>
				q
					.from({ s: showsC })
					.where(({ s }) => eq(s.id, "x"))
					.findOne(),
		});
		await live.toArrayWhenReady();
		expect(calls.length).toBe(0);
	});
});
