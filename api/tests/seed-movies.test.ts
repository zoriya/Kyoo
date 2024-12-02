import { afterAll, beforeAll, describe, expect, it, test } from "bun:test";
import { inArray } from "drizzle-orm";
import Elysia from "elysia";
import { seed } from "~/controllers/seed";
import { db } from "~/db";
import { shows, videos } from "~/db/schema";
import { dune, duneVideo } from "~/models/examples/dune-2021";

const app = new Elysia().use(seed);

const cleanup = async () => {
	await db.delete(shows).where(inArray(shows.slug, [dune.slug]));
	await db.delete(videos).where(inArray(videos.id, [duneVideo.id]));
};
// cleanup db beforehand to unsure tests are consistent
beforeAll(cleanup);
afterAll(cleanup);

describe("Movie seeding", () => {
	it("Can create a movie", async () => {
		// create video beforehand to test linking
		await db.insert(videos).values(duneVideo);

		const resp = await app.handle(
			new Request("http://localhost/movies", {
				method: "POST",
				body: JSON.stringify(dune),
				headers: {
					"Content-Type": "application/json",
				},
			}),
		);
		const body = await resp.json();

		expect(resp.status).toBe(201);
		expect(body.id).toBeString();
		expect(body.slug).toBe("dune");
		expect(body.videos).toContain({ slug: "dune" });
	});

	test.todo("Conflicting slug auto-correct", async () => {});
	test.todo("Conflict in slug+year fails", async () => {});
	test.todo("Missing videos send info", async () => {});
	test.todo("Schema error", async () => {});
	test.todo("Invalid translation name", async () => {});
	test.todo("Update existing movie", async () => {});
	test.todo("Create correct video slug (version)", async () => {});
	test.todo("Create correct video slug (part)", async () => {});
	test.todo("Create correct video slug (rendering)", async () => {});
});
