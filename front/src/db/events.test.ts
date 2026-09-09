import { beforeEach, describe, expect, test } from "bun:test";
import { createLiveQueryCollection } from "@tanstack/react-db";
import { entries } from "./entries";
import { createEventHandler } from "./events";
import {
	mockFetch,
	pagedRoute,
	rawEntry,
	rawSerie,
	testClient,
	tick,
} from "./fixtures.test-helpers";
import { shows } from "./shows";

let calls: string[];
let serverName = "Serie a";
beforeEach(() => {
	serverName = "Serie a";
	calls = mockFetch({
		"/api/shows": pagedRoute(
			() => ["a", "b"],
			(id) =>
				rawSerie(id, {
					...(id === "a" ? { name: serverName } : {}),
					firstEntry: rawEntry(1),
				}),
		),
		"/api/series/slug-a": () =>
			rawSerie("a", { name: serverName, firstEntry: rawEntry(1) }),
	});
});

const openList = async (client: ReturnType<typeof testClient>) => {
	const showsC = client.collection(shows);
	const live = createLiveQueryCollection({
		startSync: true,
		query: (q) =>
			q
				.from({ s: showsC })
				.orderBy(({ s }) => s.name)
				.limit(5)
				.offset(0),
	});
	await live.toArrayWhenReady();
	return live;
};

describe("websocket events", () => {
	test("shows invalidate re-fetches displayed shows", async () => {
		const client = testClient();
		const live = await openList(client);
		const handle = createEventHandler(client, { debounce: 60_000 });

		serverName = "Renamed";
		handle({ collection: "shows", op: "invalidate", ids: ["a"] });
		await tick();
		await tick();

		expect(calls[1]).toBe(
			"GET /api/series/slug-a?with=collection,studios,firstEntry,nextEntry",
		);
		expect(live.toArray.find((x) => x.id === "a")?.name).toBe("Renamed");
	});

	test("shows delete drops the row", async () => {
		const client = testClient();
		const live = await openList(client);
		createEventHandler(client)({
			collection: "shows",
			op: "delete",
			ids: ["b"],
		});
		await tick();
		expect(client.collection(shows).get("b")).toBeUndefined();
		expect(live.toArray.map((x) => x.id)).toEqual(["a"]);
	});

	test("entries update patches progress of local entries only", async () => {
		const client = testClient();
		await openList(client);
		const entriesC = client.collection(entries);
		expect(entriesC.get("entry-1")?.progress.percent).toBe(0);

		createEventHandler(client)({
			collection: "entries",
			op: "update",
			data: [
				{
					id: "entry-1",
					progress: {
						percent: 42,
						time: 600,
						playedDate: "2024-01-01T00:00:00Z",
						videoId: null,
					},
				},
				{
					id: "never-loaded",
					progress: { percent: 1, time: 1, playedDate: null, videoId: null },
				},
			],
		});
		await tick();
		const entry = entriesC.get("entry-1");
		expect(entry?.progress.percent).toBe(42);
		expect(entry?.progress.playedDate).toBeInstanceOf(Date);
		expect(entry?.name).toBe("Entry 1");
		expect(entriesC.get("never-loaded")).toBeUndefined();
	});

	test("malformed events are ignored", () => {
		expect(() =>
			createEventHandler(testClient())({ collection: "nope" }),
		).not.toThrow();
	});
});
