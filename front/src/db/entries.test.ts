import { beforeEach, describe, expect, test } from "bun:test";
import {
	and,
	createLiveQueryCollection,
	eq,
	gte,
	isNull,
	not,
	or,
} from "@tanstack/react-db";
import { entries } from "./entries";
import {
	mockFetch,
	pagedRoute,
	rawEntry,
	rawSerie,
	testClient,
} from "./fixtures.test-helpers";
import { shows } from "./shows";

let calls: string[];
beforeEach(() => {
	calls = mockFetch({
		"/api/series/abyss/entries": pagedRoute(
			() => ["entry-1", "entry-2", "entry-3"],
			(id) =>
				rawEntry(Number(id.slice(6)), {
					availableSince: "2024-01-01T00:00:00Z",
				}),
		),
		"/api/news": pagedRoute(
			() => ["entry-9"],
			() =>
				rawEntry(9, {
					availableSince: "2024-02-01T00:00:00Z",
					show: rawSerie("abyss-id"),
				}),
		),
		"/api/profiles/me/history": pagedRoute(
			() => ["entry-7"],
			() =>
				rawEntry(7, {
					progress: {
						percent: 40,
						time: 10,
						playedDate: "2024-03-01T00:00:00Z",
						videoId: null,
					},
					show: rawSerie("abyss-id"),
				}),
		),
	});
});

describe("entries", () => {
	test("the serie predicate becomes the url, the rest becomes the filter", async () => {
		const client = testClient();
		const entriesC = client.collection(entries);
		const live = createLiveQueryCollection({
			startSync: true,
			query: (q) =>
				q
					.from({ e: entriesC })
					.where(({ e }) =>
						and(
							eq(e.showSlug, "abyss"),
							gte(e.seasonNumber, 1),
							or(
								eq(e.kind, "episode"),
								not(isNull(e.availableSince)),
								eq(e.content, "story"),
							),
						),
					)
					.orderBy(({ e }) => e.order)
					.limit(5)
					.offset(0),
		});
		await live.toArrayWhenReady();
		expect(calls).toEqual([
			"GET /api/series/abyss/entries?filter=(seasonNumber%20ge%201%20and%20(kind%20eq%20episode%20or%20isAvailable%20eq%20true%20or%20content%20eq%20story))&sort=order&limit=5",
		]);
		// rows are stamped with the bound param so the local predicate matches
		expect(live.toArray.map((x) => x.slug)).toEqual([
			"entry-1",
			"entry-2",
			"entry-3",
		]);
		expect(entriesC.get("entry-1")?.showSlug).toBe("abyss");
	});

	test("sorting by availableSince is the news route, nested shows are normalized", async () => {
		const client = testClient();
		const entriesC = client.collection(entries);
		const showsC = client.collection(shows);
		const live = createLiveQueryCollection({
			startSync: true,
			query: (q) =>
				q
					.from({ e: entriesC })
					.leftJoin({ s: showsC }, ({ e, s }) => eq(e.showId, s.id))
					.where(({ e }) => not(isNull(e.availableSince)))
					.orderBy(({ e }) => e.availableSince, "desc")
					.select(({ e, s }) => ({ ...e, show: s }))
					.limit(10)
					.offset(0),
		});
		await live.toArrayWhenReady();
		expect(calls).toEqual([
			"GET /api/news?filter=isAvailable%20eq%20true&limit=10",
		]);
		expect(live.toArray[0]?.show?.slug).toBe("slug-abyss-id");
		expect(showsC.get("abyss-id")).toBeDefined();
	});

	test("sorting by playedDate is the history route", async () => {
		const client = testClient();
		const entriesC = client.collection(entries);
		const live = createLiveQueryCollection({
			startSync: true,
			query: (q) =>
				q
					.from({ e: entriesC })
					.where(({ e }) => not(isNull(e.progress.playedDate)))
					.orderBy(({ e }) => e.progress.playedDate, "desc")
					.limit(10)
					.offset(0),
		});
		await live.toArrayWhenReady();
		expect(calls).toEqual([
			"GET /api/profiles/me/history?sort=-playedDate&limit=10",
		]);
		expect(live.toArray.map((x) => x.slug)).toEqual(["entry-7"]);
	});
});
