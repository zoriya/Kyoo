import { beforeAll, describe, expect, it } from "bun:test";
import { createMovie, getShows } from "tests/helpers";
import { expectStatus } from "tests/utils";
import { db } from "~/db";
import { shows } from "~/db/schema";
import { bubble } from "~/models/examples";
import { dune } from "~/models/examples/dune-2021";
import { duneCollection } from "~/models/examples/dune-collection";

beforeAll(async () => {
	await db.delete(shows);
	for (const movie of [bubble, { ...dune, collection: duneCollection }]) {
		const [resp, body] = await createMovie(movie);
		expectStatus(resp, body).toBe(201);
	}
});

describe("Collection members in /shows", () => {
	it("Hides collection members by default", async () => {
		const [resp, body] = await getShows({ langs: "en" });

		expectStatus(resp, body).toBe(200);
		expect(body.items.map((x: { slug: string }) => x.slug).sort()).toEqual([
			bubble.slug,
			duneCollection.slug,
		]);
	});

	it("Returns collection members with ignoreInCollection=false", async () => {
		const [resp, body] = await getShows({
			langs: "en",
			ignoreInCollection: false,
		});

		expectStatus(resp, body).toBe(200);
		expect(body.items.map((x: { slug: string }) => x.slug).sort()).toEqual([
			bubble.slug,
			dune.slug,
			duneCollection.slug,
		]);
	});
});
