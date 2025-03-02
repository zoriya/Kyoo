import { beforeAll, describe, expect, it } from "bun:test";
import { createMovie } from "tests/helpers";
import { expectStatus } from "tests/utils";
import { db } from "~/db";
import { shows } from "~/db/schema";
import { dune } from "~/models/examples/dune-2021";
import { duneCollection } from "~/models/examples/dune-collection";

beforeAll(async () => {
	await db.delete(shows);
});

describe("Collection seeding", () => {
	it("Can create a movie with a collection", async () => {
		const [resp, body] = await createMovie({
			...dune,
			collection: duneCollection,
		});
		expectStatus(resp, body).toBe(201);
		expect(body.id).toBeString();
		expect(body.slug).toBe("dune");
		expect(body.collection.slug).toBe("dune-collection");
	});
});
