import { beforeAll, describe, expect, it } from "bun:test";
import { eq } from "drizzle-orm";
import { createVideo } from "tests/helpers";
import { expectStatus } from "tests/utils";
import { db } from "~/db";
import { entries, shows, videos } from "~/db/schema";

beforeAll(async () => {
	await db.delete(shows);
	await db.delete(entries);
	await db.delete(videos);
});

describe("Video seeding", () => {
	it("Can create a video without entry", async () => {
		const [resp, body] = await createVideo({
			guess: { title: "mia", from: "test" },
			part: null,
			path: "/video/mia s1e13.mkv",
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
		expect(vid!.path).toBe("/video/mia s1e13.mkv");
		expect(vid!.guess).toBe({ title: "mia", from: "test" });

		expect(body[0].slug).toBe("mia");
		// videos created without entries should create an /unknown entry.
		expect(vid!.evj).toBeArrayOfSize(1);
		expect(vid!.evj[0].slug).toBe("mia");
		expect(vid!.evj[0].entry).toMatchObject({
			kind: "unknown",
			name: "mia",
			// should we store the video path in the unknown entry?
			// in db it would be the `description` field
		});
	});
});
